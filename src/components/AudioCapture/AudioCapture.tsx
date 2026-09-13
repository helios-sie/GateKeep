import { forwardRef, useImperativeHandle, useRef } from 'react';

interface AudioCaptureProps {
  /** Handed the recorded audio blob once recording stops — the caller
   *  decides where and how to persist it, same split as PhotoCapture. */
  onCapture: (blob: Blob) => void;
  /** Mirrors recording start/stop so the caller can reflect it in its own
   *  trigger icon (e.g. a pulsing mic). */
  onRecordingChange?: (recording: boolean) => void;
}

export interface AudioCaptureHandle {
  /** Starts recording if idle, stops (and hands back the blob) if already recording. */
  toggle: () => void;
}

/** Whether this browser can record audio at all — check before rendering a
 *  trigger for it (there's no picker fallback anymore; unsupported means no
 *  attach-audio affordance shows). */
export const canRecordAudio =
  typeof MediaRecorder !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

function pickMimeType(): string {
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  }
  return '';
}

// Headless: no UI of its own. Records via MediaRecorder; the caller supplies
// its own mic icon and calls ref.current.toggle() to start/stop.
export const AudioCapture = forwardRef<AudioCaptureHandle, AudioCaptureProps>(function AudioCapture(
  { onCapture, onRecordingChange },
  ref
) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        stream.getTracks().forEach((track) => track.stop());
        onRecordingChange?.(false);
        if (blob.size > 0) onCapture(blob);
      };

      recorder.start();
      recorderRef.current = recorder;
      onRecordingChange?.(true);
    } catch {
      // Mic permission denied/unavailable — fail quietly rather than
      // showing an error; the icon just goes back to idle.
      onRecordingChange?.(false);
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  useImperativeHandle(ref, () => ({
    toggle: () => (recorderRef.current ? stopRecording() : startRecording()),
  }));

  return null;
});
