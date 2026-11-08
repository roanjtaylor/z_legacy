import { useState, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MiniMusicPlayer() {
  const {
    isPlaying,
    currentTrack,
    volume,
    currentTime,
    duration,
    toggleMusic,
    nextTrack,
    previousTrack,
    setVolume,
    seekTo,
  } = useMusic();

  const [isExpanded, setIsExpanded] = useState(false);
  const previousVolume = useRef(0.3);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isMuted = volume === 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = clickX / rect.width;
    seekTo(newProgress * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      previousVolume.current = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current || 0.3);
    } else {
      previousVolume.current = volume;
      setVolume(0);
    }
  };

  // Collapsed view - just a music icon
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/90 transition-all shadow-lg border border-white/20"
        title="Open music player"
      >
        <svg
          className={`w-6 h-6 text-white ${isPlaying ? 'animate-pulse' : ''}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        {isPlaying && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <span className="w-1 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </button>
    );
  }

  // Expanded view - full mini player
  return (
    <div className="fixed top-4 right-4 z-50 w-72 bg-black/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span className="text-white/60 text-xs font-medium">Now Playing</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-white/60 hover:text-white transition-colors"
          title="Minimize player"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Track info */}
      <div className="px-3 py-3">
        <p className="text-white font-medium text-sm truncate">{currentTrack.name}</p>
        <p className="text-white/50 text-xs">ThisOrThat Soundtrack</p>
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-2">
        <div
          className="h-1 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-green-500 rounded-full relative group-hover:bg-green-400 transition-colors"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-white/40 text-xs">{formatTime(currentTime)}</span>
          <span className="text-white/40 text-xs">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls row: Volume (left) and Playback (right) */}
      <div className="flex items-center justify-between px-3 pb-3">
        {/* Volume control with mute button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`w-7 h-7 rounded-full flex items-center justify-center hover:scale-105 transition-transform ${
              isMuted ? 'bg-red-500' : 'bg-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className={`w-4 h-4 ${isMuted ? 'text-white' : 'text-black'}`} fill="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              ) : volume < 0.5 ? (
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              )}
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 accent-green-500 cursor-pointer"
          />
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={previousTrack}
            className="text-white/60 hover:text-white transition-colors"
            title="Previous track"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={toggleMusic}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-white/60 hover:text-white transition-colors"
            title="Next track"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
