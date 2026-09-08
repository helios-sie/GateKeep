import { useEffect, useState } from 'react';
import { getPhoto } from '../../lib/db';

interface EntryPhotosProps {
  photoIds: string[];
}

export function EntryPhotos({ photoIds }: EntryPhotosProps) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let revoked: string[] = [];

    async function load() {
      const loaded: string[] = [];
      for (const id of photoIds) {
        const photo = await getPhoto(id);
        if (photo) loaded.push(URL.createObjectURL(photo.blob));
      }
      revoked = loaded;
      setUrls(loaded);
    }
    load();

    return () => revoked.forEach((u) => URL.revokeObjectURL(u));
  }, [photoIds]);

  if (urls.length === 0) return null;

  return (
    <div className="entry-photos">
      {urls.map((url, i) => (
        <img key={i} src={url} alt="Diary attachment" />
      ))}
    </div>
  );
}
