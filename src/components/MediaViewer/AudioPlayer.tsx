import { useEffect, useRef, useState } from 'react';
import './AudioPlayer.css';

interface AudioPlayerProps {
  src: string;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

// In-app play/pause/scrub player for an attached audio note — tapping one
// opens this instead of a browser's own default audio popup. Reusable
// wherever a page shows audio attachments (Checklist now; Diary later).
export function AudioPlayer({ src, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function scrub(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    const time = Number(e.target.value);
    if (audio) audio.currentTime = time;
    setCurrent(time);
  }

  return (
    <div className="audio-player-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="audio-player" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="audio-player-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} src={src} preload="metadata" />

        <div className="audio-player-controls">
          <button
            type="button"
            className="audio-player-toggle"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>

          <input
            type="range"
            className="audio-player-scrub"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={scrub}
            aria-label="Seek"
          />

          <span className="audio-player-time">
            {formatTime(current)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
