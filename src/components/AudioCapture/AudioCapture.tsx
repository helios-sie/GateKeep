import { forwardRef, useImperativeHandle, useRef } from 'react';

interface AudioCaptureProps {
  /** Handed the recorded audio blob once recording stops — the caller
   *  decides where and how to persist it, same split as PhotoCapture. */
  onCapture: (blob: Blob) => void;
  /** Mirrors recording start/stop so the caller can reflect it in its own
   *  trigger icon (e.g. a pulsing mic). */
  onRecordingChange?: (recording: boolean) => void;
  /** Fired instead of silently doing nothing when recording can't start —
   *  e.g. no getUserMedia (insecure context: getUserMedia only exists on
   *  HTTPS or localhost — a plain http://<lan-ip> page, like testing over
   *  the dev server's --host address on a phone, does not qualify),
   *  permission denied, or no microphone. */
  onError?: (message: string) => void;
}

export interface AudioCaptureHandle {
  /** Starts recording if idle, stops (and hands back the blob) if already recording. */
  toggle: () => void;
}

function describeStartFailure(err: unknown): string {
  const name = err instanceof DOMException ? err.name : undefined;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone permission was denied.';
  }
  if (name === 'NotFoundError') {
    return 'No microphone was found on this device.';
  }
  return 'Could not start recording.';
}

function pickMimeType(): string {
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  }
  return '';
}

// Headless: no UI of its own. Records via MediaRecorder; the caller supplies
// its own mic icon (always shown — see Editor.tsx) and calls
// ref.current.toggle() to start/stop.
export const AudioCapture = forwardRef<AudioCaptureHandle, AudioCaptureProps>(function AudioCapture(
  { onCapture, onRecordingChange, onError },
  ref
) {
  const recorderRef = useRef<MediaRecorder | null>(null);

  async function startRecording() {
    if (typeof MediaRecorder === 'undefined') {
      onError?.("Voice notes aren't supported in this browser.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.('Voice notes need a secure connection (HTTPS) to record audio.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      onError?.(describeStartFailure(err));
      onRecordingChange?.(false);
      return;
    }

    const mimeType = pickMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType });
      stream.getTracks().forEach((track) => track.stop());
      onRecordingChange?.(false);
      if (blob.size > 0) onCapture(blob);
    };

    recorder.start();
    recorderRef.current = recorder;
    onRecordingChange?.(true);
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
