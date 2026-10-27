import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { CameraIcon, MicIcon } from '../icons';
import { AudioPlayer } from '../MediaViewer/AudioPlayer';
import { ImageLightbox } from '../MediaViewer/ImageLightbox';
import { createPhotoThumbnail } from '../../lib/mediaCompression';
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
/**
 * Which viewer is open, as ONE value rather than two independent ones, so
 * "only one overlay at a time" is a property of the shape instead of
 * something every caller has to remember. Two `useState`s could both be set.
 *
 * `owned` records who has to revoke the object URL, because the two differ:
 * the photo URL is minted per-open from the full-size blob (and must be
 * revoked on close, or every tap leaks a photo), whereas the audio URL is
 * the long-lived one InlineAudio created in its effect and revokes on
 * unmount — revoking it here would break replaying the same clip.
 */
type OpenMedia =
  | { kind: 'photo'; url: string; owned: true }
  | { kind: 'audio'; url: string; owned: false };

export function SegmentContent({ content, getPhoto, getAudio }: SegmentContentProps) {
  const [open, setOpen] = useState<OpenMedia | null>(null);

  function close() {
    if (open?.owned) URL.revokeObjectURL(open.url);
    setOpen(null);
  }

  return (
    <span className="segment-content">
      {content.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.value}</span>;
        }
        if (segment.type === 'photo') {
          return (
            <InlinePhoto
              key={i}
              id={segment.id}
              getPhoto={getPhoto}
              onOpen={(url) => setOpen({ kind: 'photo', url, owned: true })}
            />
          );
        }
        return (
          <InlineAudio
            key={i}
            id={segment.id}
            getAudio={getAudio}
            onOpen={(url) => setOpen({ kind: 'audio', url, owned: false })}
          />
        );
      })}

      {open?.kind === 'photo' && <ImageLightbox src={open.url} onClose={close} />}
      {open?.kind === 'audio' && <AudioPlayer src={open.url} onClose={close} />}
    </span>
  );
}

function InlinePhoto({ id, getPhoto, onOpen }: { id: string; getPhoto: MediaFetcher; onOpen: (url: string) => void }) {
  // Only ever holds a tiny (~96px) thumbnail, never the full attached
  // photo — with several photos on one entry, decoding each at full
  // resolution just to paint a 22px icon is what was exhausting memory
  // (see mediaCompression.ts). The real photo is fetched again, once, only
  // when this icon is actually tapped (handleOpen below).
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    getPhoto(id).then(async (photo) => {
      if (cancelled || !photo) return;
      const thumbnail = await createPhotoThumbnail(photo.blob);
      if (cancelled) return;
      objectUrl = URL.createObjectURL(thumbnail);
      setThumbUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, getPhoto]);

  async function handleOpen(e: MouseEvent) {
    e.stopPropagation(); // don't let this bubble into a row's checkbox label, etc.
    const photo = await getPhoto(id);
    if (photo) onOpen(URL.createObjectURL(photo.blob));
  }

  return (
    <button
      type="button"
      className="segment-inline-photo"
      disabled={!thumbUrl}
      onClick={handleOpen}
      aria-label="View attached photo"
    >
      {thumbUrl ? <img src={thumbUrl} alt="" /> : <CameraIcon />}
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
      <MicIcon />
    </button>
  );
}
