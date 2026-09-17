/**
 * Apex Racer 2D - Main Application Controller
 * Realistic Physics & Audio + Multiplayer (Split-Screen & Online WebRTC P2P)
 */

import React, { useState, useEffect } from 'react';
import { CarStats, GameMode, GameSettings, GameView, TrackTheme, WeatherType } from './types/game';
import { AVAILABLE_CARS, TRACK_THEMES } from './game/tracks';
import { soundEngine } from './audio/soundEngine';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { CarSelectModal } from './components/CarSelectModal';
import { TrackSelectModal } from './components/TrackSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { SplitScreenLobbyModal } from './components/SplitScreenLobbyModal';
import { OnlineMabarModal } from './components/OnlineMabarModal';

export default function App() {
  // Game View Navigation State
  const [view, setView] = useState<GameView>('menu');

  // Active Game Mode
  const [gameMode, setGameMode] = useState<GameMode>('single_player');

  // Active Weather Condition
  const [weather, setWeather] = useState<WeatherType>('clear');

  // Active Car & Track Selection
  const [selectedCar, setSelectedCar] = useState<CarStats>(() => {
    const saved = localStorage.getItem('apex_racer_car');
    if (saved) {
      const found = AVAILABLE_CARS.find((c) => c.id === saved);
      if (found) return found;
    }
    return AVAILABLE_CARS[0];
  });

  // Player 2 Car for Split-Screen
  const [player2Car, setPlayer2Car] = useState<CarStats>(AVAILABLE_CARS[1]);

  const [selectedTrack, setSelectedTrack] = useState<TrackTheme>(() => {
    const saved = localStorage.getItem('apex_racer_track');
    if (saved) {
      const found = TRACK_THEMES.find((t) => t.id === saved);
      if (found) return found;
    }
    return TRACK_THEMES[0];
  });

  // Settings State
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('apex_racer_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return {
      difficulty: 'medium',
      laps: 3,
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.8,
      touchControls: isTouchDevice,
      showMinimap: true,
      weather: 'clear',
      manualGearbox: false
    };
  });

  // Best Lap Records per Track
  const [bestLaps, setBestLaps] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('apex_racer_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return {};
  });

  // Modals visibility state
  const [showCarModal, setShowCarModal] = useState<boolean>(false);
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showSplitScreenModal, setShowSplitScreenModal] = useState<boolean>(false);
  const [showOnlineModal, setShowOnlineModal] = useState<boolean>(false);

  // Sync settings changes to soundEngine & localStorage
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('apex_racer_settings', JSON.stringify(updated));

      if (newSettings.soundEnabled !== undefined) {
        soundEngine.setSoundEnabled(newSettings.soundEnabled);
      }
      if (newSettings.musicEnabled !== undefined) {
        soundEngine.setMusicEnabled(newSettings.musicEnabled);
      }
      if (newSettings.volume !== undefined) {
        soundEngine.setMasterVolume(newSettings.volume);
      }
      return updated;
    });
  };

  const handleSelectCar = (car: CarStats) => {
    setSelectedCar(car);
    localStorage.setItem('apex_racer_car', car.id);
  };

  const handleSelectTrack = (track: TrackTheme) => {
    const trackWithLaps = { ...track, laps: settings.laps || track.laps };
    setSelectedTrack(trackWithLaps);
    localStorage.setItem('apex_racer_track', track.id);
  };

  const handleResetRecords = () => {
    setBestLaps({});
    localStorage.removeItem('apex_racer_records');
  };

  // Called when race ends
  const handleFinishRace = (bestLap: number, totalTime: number, rank: number) => {
    const currentBest = bestLaps[selectedTrack.id];
    if (!currentBest || bestLap < currentBest) {
      const updated = { ...bestLaps, [selectedTrack.id]: bestLap };
      setBestLaps(updated);
      localStorage.setItem('apex_racer_records', JSON.stringify(updated));
    }
  };

  // Single Player Race Launch
  const handleStartSingleRace = () => {
    setGameMode('single_player');
    soundEngine.init();
    soundEngine.resumeContext();
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    setView('racing');
  };

  // Split-Screen Mabar Launch
  const handleStartSplitScreenRace = (
    p1Car: CarStats,
    p2Car: CarStats,
    track: TrackTheme,
    laps: number,
    chosenWeather: WeatherType
  ) => {
    setSelectedCar(p1Car);
    setPlayer2Car(p2Car);
    setSelectedTrack({ ...track, laps });
    setWeather(chosenWeather);
    setGameMode('split_screen');
    setShowSplitScreenModal(false);

    soundEngine.init();
    soundEngine.resumeContext();
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    setView('racing');
  };

  // Online P2P Mabar Launch
  const handleStartOnlineRace = (
    track: TrackTheme,
    laps: number,
    chosenWeather: WeatherType
  ) => {
    setSelectedTrack({ ...track, laps });
    setWeather(chosenWeather);
    setGameMode('online_multiplayer');
    setShowOnlineModal(false);

    soundEngine.init();
    soundEngine.resumeContext();
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    setView('racing');
  };

  const handleQuitToMenu = () => {
    soundEngine.stopEngine();
    soundEngine.stopBGM();
    setView('menu');
  };

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    handleUpdateSettings({ soundEnabled: next });
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Main Menu View */}
      {view === 'menu' && (
        <MainMenu
          selectedCar={selectedCar}
          selectedTrack={selectedTrack}
          bestLap={bestLaps[selectedTrack.id] || null}
          soundEnabled={settings.soundEnabled}
          weather={weather}
          onChangeWeather={setWeather}
          onToggleSound={handleToggleSound}
          onStartSingleRace={handleStartSingleRace}
          onOpenSplitScreen={() => setShowSplitScreenModal(true)}
          onOpenOnlineMabar={() => setShowOnlineModal(true)}
          onOpenCarSelect={() => setShowCarModal(true)}
          onOpenTrackSelect={() => setShowTrackModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenHelp={() => setShowHelpModal(true)}
        />
      )}

      {/* 2. Active 2D Canvas Racing View */}
      {view === 'racing' && (
        <GameCanvas
          selectedCar={selectedCar}
          selectedTrack={{ ...selectedTrack, laps: selectedTrack.laps || settings.laps }}
          settings={settings}
          gameMode={gameMode}
          player2CarStats={player2Car}
          weather={weather}
          onFinishRace={handleFinishRace}
          onQuitToMenu={handleQuitToMenu}
          onChangeTrack={() => {
            handleQuitToMenu();
            setShowTrackModal(true);
          }}
        />
      )}

      {/* Split-Screen 2-Player Lobby Modal */}
      {showSplitScreenModal && (
        <SplitScreenLobbyModal
          isOpen={showSplitScreenModal}
          onClose={() => setShowSplitScreenModal(false)}
          onStartSplitScreen={handleStartSplitScreenRace}
        />
      )}

      {/* Online P2P Mabar Lobby Modal */}
      {showOnlineModal && (
        <OnlineMabarModal
          isOpen={showOnlineModal}
          onClose={() => setShowOnlineModal(false)}
          playerCar={selectedCar}
          onStartOnlineRace={handleStartOnlineRace}
        />
      )}

      {/* Car Selection Modal */}
      {showCarModal && (
        <CarSelectModal
          selectedCar={selectedCar}
          onSelectCar={handleSelectCar}
          onClose={() => setShowCarModal(false)}
        />
      )}

      {/* Track Selection Modal */}
      {showTrackModal && (
        <TrackSelectModal
          selectedTrack={selectedTrack}
          onSelectTrack={(t) => {
            handleSelectTrack(t);
            setShowTrackModal(false);
          }}
          onClose={() => setShowTrackModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetRecords={handleResetRecords}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
