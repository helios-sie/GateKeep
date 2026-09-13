import { useEffect, useState } from 'react';
import { AudioPlayer } from '../../../../components/MediaViewer/AudioPlayer';
import { ImageLightbox } from '../../../../components/MediaViewer/ImageLightbox';
import { getTaskAudio, getTaskPhoto } from '../../../../lib/db';
import { getTaskContent } from '../../../../lib/taskContent';
import type { Task } from '../../../../types/task';
import './TaskContent.css';

interface TaskContentProps {
  task: Task;
}

// Renders a task's segments in order — plain text as text, photo/audio
// segments as small tappable icons right where they were inserted, inline
// with the surrounding text (not a separate list below). Tapping one opens
// the shared in-app viewer, never a new tab or the OS's own viewer/player.
export function TaskContent({ task }: TaskContentProps) {
  const segments = getTaskContent(task);
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null);
  const [openAudioUrl, setOpenAudioUrl] = useState<string | null>(null);

  return (
    <span className="task-content">
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.value}</span>;
        }
        if (segment.type === 'photo') {
          return <InlinePhoto key={i} id={segment.id} onOpen={setOpenPhotoUrl} />;
        }
        return <InlineAudio key={i} id={segment.id} onOpen={setOpenAudioUrl} />;
      })}

      {openPhotoUrl && <ImageLightbox src={openPhotoUrl} onClose={() => setOpenPhotoUrl(null)} />}
      {openAudioUrl && <AudioPlayer src={openAudioUrl} onClose={() => setOpenAudioUrl(null)} />}
    </span>
  );
}

interface InlineMediaProps {
  id: string;
  onOpen: (url: string) => void;
}

function InlinePhoto({ id, onOpen }: InlineMediaProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getTaskPhoto(id).then((photo) => {
      if (cancelled || !photo) return;
      objectUrl = URL.createObjectURL(photo.blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return (
    <button
      type="button"
      className="task-inline-photo"
      disabled={!url}
      onClick={(e) => {
        e.stopPropagation(); // don't let this bubble into the row's checkbox label
        if (url) onOpen(url);
      }}
      aria-label="View attached photo"
    >
      {url ? <img src={url} alt="" /> : '📷'}
    </button>
  );
}

function InlineAudio({ id, onOpen }: InlineMediaProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getTaskAudio(id).then((audio) => {
      if (cancelled || !audio) return;
      objectUrl = URL.createObjectURL(audio.blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return (
    <button
      type="button"
      className="task-inline-audio"
      disabled={!url}
      onClick={(e) => {
        e.stopPropagation();
        if (url) onOpen(url);
      }}
      aria-label="Play attached audio note"
    >
      🎤
    </button>
  );
}
