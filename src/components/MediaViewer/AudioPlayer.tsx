import { useEffect, useRef, useState } from 'react';
import './AudioPlayer.css';

interface AudioPlayerProps {
  src: string;
  onClose: () => void;
  /** Suggested filename for the Download button. */
  downloadName?: string;
}

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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
export function AudioPlayer({ src, onClose, downloadName = 'audio-note.webm' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);

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

  // Reset to normal speed whenever a different clip is opened, and keep the
  // element's actual rate in sync with the selector otherwise.
  useEffect(() => {
    setRate(1);
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

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
        <div className="audio-player-actions">
          <a
            className="audio-player-icon-btn"
            href={src}
            download={downloadName}
            aria-label="Download audio note"
          >
            ⬇
          </a>
          <button type="button" className="audio-player-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

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

        <div className="audio-player-rate-row">
          <label htmlFor="audio-player-rate">Speed</label>
          <select
            id="audio-player-rate"
            className="audio-player-rate"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
