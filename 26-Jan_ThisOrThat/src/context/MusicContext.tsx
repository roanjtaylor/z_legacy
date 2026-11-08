import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import FordVSFerrari from '../assets/FordVSFerrari.m4a';
import F1ImBad from '../assets/F1ImBad.mp3';
import KickstartHeart from '../assets/KickstartHeart.mp3';

interface Track {
  name: string;
  src: string;
}

const playlist: Track[] = [
  { name: 'Ford V Ferrari', src: FordVSFerrari },
  { name: "Bad As I Used To Be", src: F1ImBad },
  { name: 'Kickstart My Heart', src: KickstartHeart },
];

interface MusicContextType {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTrack: Track;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: Track[];
  toggleMusic: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolumeState] = useState(0.3);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasInteracted = useRef(false);

  const currentTrack = playlist[currentTrackIndex];

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(currentTrack.src);
    audio.volume = volume;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Auto-advance to next track
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    // Try to play on first user interaction (browsers block autoplay)
    const startMusic = () => {
      if (!hasInteracted.current && audioRef.current) {
        hasInteracted.current = true;
        audioRef.current.play().catch(() => {
          // Autoplay blocked, will need manual start
        });
      }
    };

    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    if (!audioRef.current) return;

    const wasPlaying = !audioRef.current.paused;
    audioRef.current.src = currentTrack.src;
    audioRef.current.volume = volume;

    if (wasPlaying || hasInteracted.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentTrackIndex]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    hasInteracted.current = true;

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  }, []);

  const previousTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        currentTrackIndex,
        currentTrack,
        volume,
        currentTime,
        duration,
        playlist,
        toggleMusic,
        nextTrack,
        previousTrack,
        setVolume,
        seekTo,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
