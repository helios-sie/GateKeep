import { useEffect, useState } from 'react';
import { AudioPlayer } from '../MediaViewer/AudioPlayer';
import { ImageLightbox } from '../MediaViewer/ImageLightbox';
import type { ContentSegment } from '../../types/content';
import './SegmentContent.css';

interface MediaFetcher {
  (id: string): Promise<{ blob: Blob } | undefined>;
}

interface SegmentContentProps {
  content: ContentSegment[];
  getPhoto: MediaFetcher;
  getAudio: MediaFetcher;
}

// Renders a segment list in order — plain text as text, photo/audio segments
// as small tappable icons right where they were inserted, inline with the
// surrounding text (not a separate list). Tapping one opens the shared
// in-app viewer, never a new tab or the OS's own viewer/player. Shared by
// Checklist tasks (TaskContent) and Diary entries — only which store to
// fetch media from differs.
export function SegmentContent({ content, getPhoto, getAudio }: SegmentContentProps) {
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null);
  const [openAudioUrl, setOpenAudioUrl] = useState<string | null>(null);

  return (
    <span className="segment-content">
      {content.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.value}</span>;
        }
        if (segment.type === 'photo') {
          return <InlinePhoto key={i} id={segment.id} getPhoto={getPhoto} onOpen={setOpenPhotoUrl} />;
        }
        return <InlineAudio key={i} id={segment.id} getAudio={getAudio} onOpen={setOpenAudioUrl} />;
      })}

      {openPhotoUrl && <ImageLightbox src={openPhotoUrl} onClose={() => setOpenPhotoUrl(null)} />}
      {openAudioUrl && <AudioPlayer src={openAudioUrl} onClose={() => setOpenAudioUrl(null)} />}
    </span>
  );
}

function InlinePhoto({ id, getPhoto, onOpen }: { id: string; getPhoto: MediaFetcher; onOpen: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getPhoto(id).then((photo) => {
      if (cancelled || !photo) return;
      objectUrl = URL.createObjectURL(photo.blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, getPhoto]);

  return (
    <button
      type="button"
      className="segment-inline-photo"
      disabled={!url}
      onClick={(e) => {
        e.stopPropagation(); // don't let this bubble into a row's checkbox label, etc.
        if (url) onOpen(url);
      }}
      aria-label="View attached photo"
    >
      {url ? <img src={url} alt="" /> : '📷'}
    </button>
  );
}

function InlineAudio({ id, getAudio, onOpen }: { id: string; getAudio: MediaFetcher; onOpen: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getAudio(id).then((audio) => {
      if (cancelled || !audio) return;
      objectUrl = URL.createObjectURL(audio.blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, getAudio]);

  return (
    <button
      type="button"
      className="segment-inline-audio"
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
