/**
 * Multiplayer Network Manager
 * Powered by PeerJS (WebRTC DataChannel) with BroadcastChannel fallback for zero-latency local testing.
 */

import { Peer, DataConnection } from 'peerjs';
import { CarStats, NetworkCarPacket, OnlinePlayer, QuickChatMessage } from '../types/game';

export type NetworkEventType =
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'race_start'
  | 'car_update'
  | 'quick_chat'
  | 'error';

export interface NetworkCallbacks {
  onPlayerListChange?: (players: OnlinePlayer[]) => void;
  onRaceStart?: (trackId: string, laps: number) => void;
  onRemoteCarUpdate?: (packet: NetworkCarPacket) => void;
  onQuickChat?: (chat: QuickChatMessage) => void;
  onError?: (msg: string) => void;
  onConnected?: (roomCode: string, isHost: boolean) => void;
}

export class MultiplayerManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;

  public roomCode: string = '';
  public isHost: boolean = false;
  public myPlayerId: string = '';
  public myPlayerName: string = '';
  public myCarStats: CarStats | null = null;

  public players: OnlinePlayer[] = [];
  private callbacks: NetworkCallbacks | null = null;

  constructor() {
    this.myPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    try {
      this.broadcastChannel = new BroadcastChannel('apex_racer_mabar');
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
    } catch {
      // BroadcastChannel unsupported fallback
    }
  }

  public setCallbacks(callbacks: NetworkCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Create a new room as Host
   */
  public createRoom(
    playerName: string,
    carStats: CarStats,
    customCode?: string
  ): Promise<string> {
    this.isHost = true;
    this.myPlayerName = playerName;
    this.myCarStats = carStats;

    // Generate readable 4-6 char room code like APEX-74
    const code = customCode || `APEX${Math.floor(100 + Math.random() * 900)}`;
    this.roomCode = code.toUpperCase();

    return new Promise((resolve, reject) => {
      try {
        const peerId = `apex_racer_${this.roomCode}`;
        this.peer = new Peer(peerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.players = [
            {
              id: this.myPlayerId,
              name: this.myPlayerName,
              isHost: true,
              isReady: true,
              carStats: this.myCarStats!
            }
          ];
          this.callbacks?.onConnected(this.roomCode, true);
          this.callbacks?.onPlayerListChange([...this.players]);
          resolve(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
          this.setupHostConnection(conn);
        });

        this.peer.on('error', (err) => {
          // If PeerJS ID taken or network issue, fallback to BroadcastChannel room
          console.warn('Peer error, operating in local BroadcastChannel mode:', err);
          this.players = [
            {
              id: this.myPlayerId,
              name: this.myPlayerName,
              isHost: true,
              isReady: true,
              carStats: this.myCarStats!
            }
          ];
          this.callbacks?.onConnected(this.roomCode, true);
          this.callbacks?.onPlayerListChange([...this.players]);
          resolve(this.roomCode);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Join an existing room as Guest
   */
  public joinRoom(
    roomCode: string,
    playerName: string,
    carStats: CarStats
  ): Promise<boolean> {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase().trim();
    this.myPlayerName = playerName;
    this.myCarStats = carStats;

    return new Promise((resolve) => {
      try {
        this.peer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        const targetPeerId = `apex_racer_${this.roomCode}`;

        this.peer.on('open', () => {
          const conn = this.peer!.connect(targetPeerId);
          this.connection = conn;

          conn.on('open', () => {
            // Handshake with host
            conn.send({
              type: 'join',
              roomCode: this.roomCode,
              player: {
                id: this.myPlayerId,
                name: this.myPlayerName,
                isHost: false,
                isReady: false,
                carStats: this.myCarStats
              }
            });
            this.callbacks?.onConnected(this.roomCode, false);
            resolve(true);
          });

          conn.on('data', (data) => {
            this.handleIncomingMessage(data);
          });

          conn.on('error', () => {
            // Also notify via broadcast channel
            this.broadcast({
              type: 'join',
              roomCode: this.roomCode,
              player: {
                id: this.myPlayerId,
                name: this.myPlayerName,
                isHost: false,
                isReady: false,
                carStats: this.myCarStats
              }
            });
            resolve(true);
          });
        });

        this.peer.on('error', () => {
          // Fallback to broadcast channel
          this.broadcast({
            type: 'join',
            roomCode: this.roomCode,
            player: {
              id: this.myPlayerId,
              name: this.myPlayerName,
              isHost: false,
              isReady: false,
              carStats: this.myCarStats
            }
          });
          this.callbacks?.onConnected(this.roomCode, false);
          resolve(true);
        });

        // Timeout fallback
        setTimeout(() => {
          this.broadcast({
            type: 'join',
            roomCode: this.roomCode,
            player: {
              id: this.myPlayerId,
              name: this.myPlayerName,
              isHost: false,
              isReady: false,
              carStats: this.myCarStats
            }
          });
          resolve(true);
        }, 1800);
      } catch {
        resolve(true);
      }
    });
  }

  private setupHostConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.handleIncomingMessage(data);
      // Host relays to all other connected peers
      this.broadcastToPeers(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  private broadcastToPeers(data: unknown, exceptPeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== exceptPeerId && conn.open) {
        conn.send(data);
      }
    });
  }

  private broadcast(data: unknown) {
    if (this.connection && this.connection.open) {
      this.connection.send(data);
    }
    this.broadcastToPeers(data);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch {
        // ignore
      }
    }
  }

  private handleIncomingMessage(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    const msg = raw as Record<string, any>;

    // Filter by room code
    if (msg.roomCode && msg.roomCode !== this.roomCode) return;

    switch (msg.type) {
      case 'join': {
        const p = msg.player as OnlinePlayer;
        if (p && p.id !== this.myPlayerId) {
          const exists = this.players.some((item) => item.id === p.id);
          if (!exists) {
            this.players.push(p);
            this.callbacks?.onPlayerListChange([...this.players]);
          }
          if (this.isHost) {
            // Reply with full player list and track
            this.broadcast({
              type: 'sync_players',
              roomCode: this.roomCode,
              players: this.players
            });
          }
        }
        break;
      }

      case 'sync_players': {
        if (Array.isArray(msg.players)) {
          this.players = msg.players;
          this.callbacks?.onPlayerListChange([...this.players]);
        }
        break;
      }

      case 'ready_toggle': {
        const target = this.players.find((p) => p.id === msg.playerId);
        if (target) {
          target.isReady = msg.isReady;
          this.callbacks?.onPlayerListChange([...this.players]);
        }
        break;
      }

      case 'start_race': {
        this.callbacks?.onRaceStart(msg.trackId, msg.laps);
        break;
      }

      case 'car_packet': {
        const packet = msg.packet as NetworkCarPacket;
        if (packet && packet.id !== this.myPlayerId) {
          this.callbacks?.onRemoteCarUpdate(packet);
        }
        break;
      }

      case 'chat': {
        const chat = msg.chat as QuickChatMessage;
        if (chat) {
          this.callbacks?.onQuickChat(chat);
        }
        break;
      }
    }
  }

  /**
   * Transmit live car telemetry packet
   */
  public sendCarPacket(packet: NetworkCarPacket) {
    this.broadcast({
      type: 'car_packet',
      roomCode: this.roomCode,
      packet
    });
  }

  /**
   * Host starts the race
   */
  public startRace(trackId: string, laps: number) {
    this.broadcast({
      type: 'start_race',
      roomCode: this.roomCode,
      trackId,
      laps
    });
    this.callbacks?.onRaceStart(trackId, laps);
  }

  /**
   * Toggle ready state
   */
  public setReady(isReady: boolean) {
    const me = this.players.find((p) => p.id === this.myPlayerId);
    if (me) me.isReady = isReady;
    this.broadcast({
      type: 'ready_toggle',
      roomCode: this.roomCode,
      playerId: this.myPlayerId,
      isReady
    });
    this.callbacks?.onPlayerListChange([...this.players]);
  }

  /**
   * Send quick chat message
   */
  public sendQuickChat(text: string) {
    const chat: QuickChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderName: this.myPlayerName,
      text,
      timestamp: Date.now()
    };
    this.broadcast({
      type: 'chat',
      roomCode: this.roomCode,
      chat
    });
    this.callbacks?.onQuickChat(chat);
  }

  /**
   * Cleanup connections
   */
  public disconnect() {
    try {
      this.connection?.close();
      this.connections.forEach((c) => c.close());
      this.connections.clear();
      this.peer?.destroy();
      this.peer = null;
    } catch {
      // ignore
    }
  }
}

export const multiplayerManager = new MultiplayerManager();
