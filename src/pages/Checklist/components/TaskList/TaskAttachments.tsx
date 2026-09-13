import { useEffect, useState } from 'react';
import { AudioPlayer } from '../../../../components/MediaViewer/AudioPlayer';
import { ImageLightbox } from '../../../../components/MediaViewer/ImageLightbox';
import { getTaskAudio, getTaskPhoto } from '../../../../lib/db';
import './TaskAttachments.css';

interface TaskAttachmentsProps {
  photoIds: string[];
  audioIds: string[];
}

interface LoadedMedia {
  id: string;
  url: string;
}

function useObjectUrls(
  ids: string[],
  fetchBlob: (id: string) => Promise<{ blob: Blob } | undefined>
): LoadedMedia[] {
  const [loaded, setLoaded] = useState<LoadedMedia[]>([]);

  useEffect(() => {
    let cancelled = false;
    let urls: string[] = [];

    (async () => {
      const next: LoadedMedia[] = [];
      for (const id of ids) {
        const item = await fetchBlob(id);
        if (item) next.push({ id, url: URL.createObjectURL(item.blob) });
      }
      if (cancelled) {
        next.forEach((m) => URL.revokeObjectURL(m.url));
        return;
      }
      urls = next.map((m) => m.url);
      setLoaded(next);
    })();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  return loaded;
}

// Thumbnails/chips for a task's attached photos and audio notes. Tapping one
// opens the shared in-app viewer (ImageLightbox / AudioPlayer) — never a new
// tab and never the OS's own viewer/player.
export function TaskAttachments({ photoIds, audioIds }: TaskAttachmentsProps) {
  const photos = useObjectUrls(photoIds, getTaskPhoto);
  const audios = useObjectUrls(audioIds, getTaskAudio);

  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null);
  const [openAudio, setOpenAudio] = useState<LoadedMedia | null>(null);

  if (photos.length === 0 && audios.length === 0) return null;

  return (
    <div className="task-attachments">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          className="task-attachment-photo"
          onClick={() => setOpenPhotoUrl(photo.url)}
          aria-label="View attached photo"
        >
          <img src={photo.url} alt="" />
        </button>
      ))}

      {audios.map((audio, i) => (
        <button
          key={audio.id}
          type="button"
          className="task-attachment-audio"
          onClick={() => setOpenAudio(audio)}
        >
          🎙️ Voice note{audios.length > 1 ? ` ${i + 1}` : ''}
        </button>
      ))}

      {openPhotoUrl && <ImageLightbox src={openPhotoUrl} onClose={() => setOpenPhotoUrl(null)} />}
      {openAudio && <AudioPlayer src={openAudio.url} onClose={() => setOpenAudio(null)} />}
    </div>
  );
}
