import React, { useState, useEffect } from 'react';
import { CarStats, OnlinePlayer, QuickChatMessage, TrackTheme, WeatherType } from '../types/game';
import { AVAILABLE_CARS, TRACK_THEMES } from '../game/tracks';
import { multiplayerManager } from '../game/multiplayer';
import { Globe, Users, Copy, Check, Send, Play, Sun, CloudRain, Moon, Sunset, Wifi } from 'lucide-react';

interface OnlineMabarModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCar: CarStats;
  onStartOnlineRace: (track: TrackTheme, laps: number, weather: WeatherType) => void;
}

export const OnlineMabarModal: React.FC<OnlineMabarModalProps> = ({
  isOpen,
  onClose,
  playerCar,
  onStartOnlineRace
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>('Pembalap');
  const [selectedCarId, setSelectedCarId] = useState<string>(playerCar.id);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACK_THEMES[0].id);
  const [laps, setLaps] = useState<number>(3);
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [copied, setCopied] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<QuickChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedCar = AVAILABLE_CARS.find((c) => c.id === selectedCarId) || AVAILABLE_CARS[0];
  const selectedTrack = TRACK_THEMES.find((t) => t.id === selectedTrackId) || TRACK_THEMES[0];

  useEffect(() => {
    if (!isOpen) {
      if (isInRoom) {
        multiplayerManager.disconnect();
        setIsInRoom(false);
      }
      return;
    }

    multiplayerManager.setCallbacks({
      onPlayerListChange: (updatedPlayers) => {
        setPlayers(updatedPlayers);
      },
      onRaceStart: (trackId, raceLaps) => {
        const trk = TRACK_THEMES.find((t) => t.id === trackId) || TRACK_THEMES[0];
        onStartOnlineRace(trk, raceLaps, weather);
      },
      onRemoteCarUpdate: () => {
        // Handled directly inside game loop
      },
      onQuickChat: (chat) => {
        setChatLog((prev) => [...prev.slice(-20), chat]);
      },
      onError: (msg) => {
        alert(msg);
      },
      onConnected: (code, hostFlag) => {
        setCurrentRoomCode(code);
        setIsHost(hostFlag);
        setIsInRoom(true);
        setIsLoading(false);
      }
    });

    return () => {
      // do not disconnect if starting race
    };
  }, [isOpen, weather, onStartOnlineRace, isInRoom]);

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    setIsLoading(true);
    try {
      const code = await multiplayerManager.createRoom(playerName, selectedCar);
      setCurrentRoomCode(code);
      setIsHost(true);
      setIsInRoom(true);
    } catch {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    setIsLoading(true);
    try {
      await multiplayerManager.joinRoom(roomCodeInput.trim(), playerName, selectedCar);
      setCurrentRoomCode(roomCodeInput.trim().toUpperCase());
      setIsHost(false);
      setIsInRoom(true);
    } catch {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    multiplayerManager.sendQuickChat(chatInput.trim());
    setChatInput('');
  };

  const handleToggleReady = () => {
    const next = !isReady;
    setIsReady(next);
    multiplayerManager.setReady(next);
  };

  const handleStartRace = () => {
    multiplayerManager.startRace(selectedTrackId, laps);
  };

  const quickTaunts = ['Gaspol!', 'Awas tikungan!', 'Lihat drift ini!', 'GG!', 'Nitro on! ⚡'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md">
      <div
        id="online-mabar-modal"
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Mabar Online (Beda Perangkat / Tab)
              </h2>
              <p className="text-xs text-slate-400">
                Hubungkan dengan teman lewat Kode Kamar via WebRTC P2P berkecepatan tinggi!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {!isInRoom ? (
            /* Setup Screen (Before entering room) */
            <div className="space-y-5">
              {/* Tab Selector: Create vs Join */}
              <div className="flex rounded-2xl bg-slate-800/80 p-1 border border-slate-700/60">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all ${
                    activeTab === 'create'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Buat Kamar Baru (Host)
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all ${
                    activeTab === 'join'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gabung Kamar Teman
                </button>
              </div>

              {/* Player Profile Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Nama Kamu:</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                    placeholder="Masukkan nama"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Pilih Mobil:</label>
                  <select
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
                  >
                    {AVAILABLE_CARS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.tagline.slice(0, 24)}...)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action area */}
              {activeTab === 'create' ? (
                <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Wifi className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Siap Membuat Kamar Balapan</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Sistem akan membuat kode kamar unik yang bisa kamu bagikan ke temanmu untuk bergabung dan balapan bersama.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Membuat Kamar...' : 'Buat Kamar Sekarang 🚀'}
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1.5">
                      Masukkan Kode Kamar dari Teman:
                    </label>
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: APEX-74"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border-2 border-emerald-500/50 text-white font-mono font-black text-lg uppercase tracking-wider focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <button
                    onClick={handleJoinRoom}
                    disabled={isLoading || !roomCodeInput.trim()}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Menghubungkan...' : 'Gabung ke Kamar'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Inside Room Lobby */
            <div className="space-y-6">
              {/* Room Code Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-800/60 to-slate-800/40 border border-emerald-500/30 gap-3">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Kode Kamar Kamu:
                  </span>
                  <div className="text-2xl md:text-3xl font-mono font-black text-white tracking-wider flex items-center gap-3">
                    {currentRoomCode}
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors text-xs flex items-center gap-1 font-sans"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span className="text-[11px] font-bold">{copied ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  Status: <span className="text-emerald-400 font-bold">Terhubung Online</span>
                  <div className="text-[11px] text-slate-500 font-mono">Buka tab baru untuk coba mabar!</div>
                </div>
              </div>

              {/* Player list in lobby */}
              <div>
                <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Daftar Pembalap di Kamar ({players.length}):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm"
                          style={{ backgroundColor: p.carStats.bodyColor }}
                        />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            {p.name}
                            {p.isHost && (
                              <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-amber-500 text-slate-950">
                                HOST
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{p.carStats.name}</div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wider ${
                          p.isReady || p.isHost
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-700/40 text-slate-400'
                        }`}
                      >
                        {p.isHost ? 'PEMILIK' : p.isReady ? 'SIAP' : 'BELUM'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Host track configuration */}
              {isHost && (
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Pengaturan Sirkuit (Host)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-bold block mb-1">Pilih Trek</label>
                      <select
                        value={selectedTrackId}
                        onChange={(e) => setSelectedTrackId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                      >
                        {TRACK_THEMES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-bold block mb-1">Jumlah Lap</label>
                      <select
                        value={laps}
                        onChange={(e) => setLaps(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                      >
                        <option value={2}>2 Lap</option>
                        <option value={3}>3 Lap</option>
                        <option value={5}>5 Lap</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-bold block mb-1">Cuaca</label>
                      <select
                        value={weather}
                        onChange={(e) => setWeather(e.target.value as WeatherType)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                      >
                        <option value="clear">Cerah</option>
                        <option value="rain">Hujan (Wet)</option>
                        <option value="sunset">Senja</option>
                        <option value="night">Malam</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Chat & Taunts */}
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Chat / Taunt:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {quickTaunts.map((t) => (
                      <button
                        key={t}
                        onClick={() => multiplayerManager.sendQuickChat(t)}
                        className="px-2 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-200 text-[10px] font-bold"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Log */}
                {chatLog.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-900/60 text-xs border border-slate-800">
                    {chatLog.map((c) => (
                      <div key={c.id} className="text-slate-300">
                        <span className="font-bold text-cyan-400">{c.senderName}: </span>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tulis pesan..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 md:p-6 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
          >
            {isInRoom ? 'Keluar Kamar' : 'Tutup'}
          </button>

          {isInRoom && (
            <div className="flex items-center gap-3">
              {!isHost && (
                <button
                  onClick={handleToggleReady}
                  className={`px-6 py-2.5 rounded-2xl font-black text-sm transition-all ${
                    isReady
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isReady ? 'Batalkan Siap' : 'Saya Siap! 👍'}
                </button>
              )}

              {isHost && (
                <button
                  id="online-btn-start"
                  onClick={handleStartRace}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  Mulai Balapan Mabar!
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
