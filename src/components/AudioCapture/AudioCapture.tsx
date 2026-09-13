import { useRef, useState } from 'react';

interface AudioCaptureProps {
  /** Handed the raw recorded/picked audio blob — the caller decides where
   *  and how to persist it, same split as PhotoCapture. */
  onCapture: (blob: Blob) => void;
}

const canRecord =
  typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

function pickMimeType(): string {
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  }
  return '';
}

// Records via MediaRecorder when the browser/permission allows it; a plain
// file picker is always available too, as the fallback the task asked for
// (also the only option on browsers without mic support).
export function AudioCapture({ onCapture }: AudioCaptureProps) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      streamRef.current = stream;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size > 0) onCapture(blob);
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      // Mic permission denied/unavailable — the file-picker button below
      // still works, so fail quietly rather than showing an error.
      setRecording(false);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = '';
  }

  return (
    <>
      {canRecord && (
        <button
          type="button"
          className={recording ? 'mic-active' : ''}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? '● Recording…' : '🎙️ Record'}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={handleFilePicked}
      />
      <button type="button" onClick={() => fileInputRef.current?.click()}>
        📎 Audio file
      </button>
    </>
  );
}
