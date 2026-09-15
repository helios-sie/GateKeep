import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '../icons';
import { AlertIcon, ChestIcon, DownloadIcon, UploadIcon } from './icons';
import {
  createBackup,
  downloadBlob,
  readBackupFile,
  restoreBackup,
  type BackupFile,
  type BackupSummary,
} from '../../lib/backup';
import './BackupPanel.css';

/*
 * The treasure chest in the header, and the panel it opens.
 *
 * Backup and restore ONLY — it is not a settings drawer, and nothing else
 * should be added to it. The slide-in mechanics (scrim, panel, close timing)
 * intentionally mirror ProfileMenu's so the two feel like the same app, but
 * this is its own component with its own class names: the two share no state,
 * no markup and no styles, and neither can break the other.
 */

/** Matches the panel's slide-out animation in BackupPanel.css. */
const CLOSE_MS = 220;

/*
 * A restore swaps out the whole database underneath a page that is already
 * mounted, so the app reloads once it lands. It is not belt-and-braces:
 * useTasks and useDiaryEntry each reload only after their OWN writes and when
 * the date changes — they don't subscribe to the change events — so without
 * this the Checklist and Diary keep showing whatever they read at mount and
 * the restored entries appear to have vanished until the user navigates.
 * Reloading is also the only way to be sure no component is left holding a
 * blob URL for a photo that no longer exists.
 *
 * Long enough that the "Restored …" line is actually readable first.
 */
const RELOAD_AFTER_RESTORE_MS = 1400;

/** What the panel is showing. The confirm step exists so the warning is read
 *  against the file the user actually picked, not before picking one. */
type View =
  | { kind: 'menu' }
  | { kind: 'confirm'; backup: BackupFile; summary: BackupSummary; filename: string };

type Status = { tone: 'ok' | 'error'; message: string } | null;

function describe(summary: BackupSummary): string {
  const parts = [
    `${summary.tasks} ${summary.tasks === 1 ? 'task' : 'tasks'}`,
    `${summary.diaryEntries} ${summary.diaryEntries === 1 ? 'diary entry' : 'diary entries'}`,
    `${summary.photos} ${summary.photos === 1 ? 'photo' : 'photos'}`,
    `${summary.audio} ${summary.audio === 1 ? 'recording' : 'recordings'}`,
  ];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function BackupPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<View>({ kind: 'menu' });
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function open() {
    setView({ kind: 'menu' });
    setStatus(null);
    setIsOpen(true);
  }

  function close() {
    // Never mid-write: a restore is a single transaction, and closing the
    // panel under it would leave the user with no idea whether it landed.
    if (busy) return;
    setIsClosing(true);
  }

  // Unmount only once the slide-out has played. Under prefers-reduced-motion
  // index.css disables the animation, so the panel simply sits still for this
  // beat and then goes — no transition to wait on, but nothing broken either.
  useEffect(() => {
    if (!isClosing) return;
    const t = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [isClosing]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) setIsClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, busy]);

  async function handleBackup() {
    setStatus(null);
    setBusy('backup');
    try {
      const { blob, filename, summary } = await createBackup();
      downloadBlob(blob, filename);
      setStatus({ tone: 'ok', message: `Saved ${filename} — ${describe(summary)}.` });
    } catch (error) {
      setStatus({ tone: 'error', message: messageFor(error) });
    } finally {
      setBusy(null);
    }
  }

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Cleared straight away so picking the same file twice in a row still
    // fires a change event.
    e.target.value = '';
    if (!file) return;

    setStatus(null);
    try {
      const { backup, summary } = await readBackupFile(file);
      setView({ kind: 'confirm', backup, summary, filename: file.name });
    } catch (error) {
      setStatus({ tone: 'error', message: messageFor(error) });
    }
  }

  async function handleRestore(backup: BackupFile) {
    setStatus(null);
    setBusy('restore');
    try {
      const summary = await restoreBackup(backup);
      setView({ kind: 'menu' });
      setStatus({ tone: 'ok', message: `Restored ${describe(summary)}. Reopening…` });
      // Left busy on purpose: nothing should be started in the beat before
      // the reload takes the page away.
      window.setTimeout(() => window.location.reload(), RELOAD_AFTER_RESTORE_MS);
      return;
    } catch (error) {
      setStatus({ tone: 'error', message: messageFor(error) });
    }
    setBusy(null);
  }

  return (
    <>
      <button
        type="button"
        className={isOpen && !isClosing ? 'backup-button is-open' : 'backup-button'}
        onClick={open}
        aria-label="Backup and restore"
        aria-haspopup="dialog"
        aria-expanded={isOpen && !isClosing}
      >
        <ChestIcon />
      </button>

      {isOpen && (
        <div className={isClosing ? 'backup-menu is-closing' : 'backup-menu'}>
          <button type="button" className="backup-scrim" aria-label="Close backup and restore" onClick={close} />

          <aside className="backup-panel" role="dialog" aria-modal="true" aria-label="Backup and restore">
            <header className="backup-panel-head">
              <span className="backup-panel-seal" aria-hidden="true">
                <ChestIcon size={24} />
              </span>

              <h2>Your chest</h2>

              <button type="button" className="backup-panel-icon-button" aria-label="Close" onClick={close}>
                <CloseIcon width={20} height={20} />
              </button>
            </header>

            {view.kind === 'menu' ? (
              <div className="backup-body">
                <p className="backup-intro">
                  Everything you write lives only on this device. A backup gathers all of it — tasks,
                  diary entries, photos and recordings — into one file you can keep somewhere safe.
                </p>

                <button
                  type="button"
                  className="backup-action"
                  onClick={handleBackup}
                  disabled={busy !== null}
                >
                  <DownloadIcon className="backup-action-glyph" />
                  <span className="backup-action-text">
                    <span className="backup-action-label">
                      {busy === 'backup' ? 'Gathering…' : 'Backup my data'}
                    </span>
                    <span className="backup-action-blurb">
                      Saves one file to this device, dated today.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="backup-action"
                  onClick={() => fileInput.current?.click()}
                  disabled={busy !== null}
                >
                  <UploadIcon className="backup-action-glyph" />
                  <span className="backup-action-text">
                    <span className="backup-action-label">Restore from backup</span>
                    <span className="backup-action-blurb">
                      Choose a backup file to put everything back.
                    </span>
                  </span>
                </button>

                <input
                  ref={fileInput}
                  type="file"
                  className="backup-file-input"
                  accept="application/json,.json"
                  onChange={handleFilePicked}
                />

                {status && (
                  <p className={status.tone === 'error' ? 'backup-status is-error' : 'backup-status'} role="status">
                    {status.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="backup-body">
                <div className="backup-warning">
                  <AlertIcon className="backup-warning-glyph" />
                  <div>
                    <p className="backup-warning-title">This replaces everything</p>
                    <p className="backup-warning-body">
                      Restoring does not merge. Everything currently in GateKeep on this device —
                      every task, diary entry, photo and recording — is erased first, and then
                      replaced with what is in this file. Anything written since the backup was made
                      will be gone.
                    </p>
                  </div>
                </div>

                <p className="backup-file-summary">
                  <span className="backup-file-name">{view.filename}</span>
                  holds {describe(view.summary)}.
                </p>

                <div className="backup-confirm-row">
                  <button
                    type="button"
                    className="backup-secondary"
                    onClick={() => setView({ kind: 'menu' })}
                    disabled={busy !== null}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="backup-primary"
                    onClick={() => handleRestore(view.backup)}
                    disabled={busy !== null}
                  >
                    {busy === 'restore' ? 'Restoring…' : 'Erase and restore'}
                  </button>
                </div>

                {status && status.tone === 'error' && (
                  <p className="backup-status is-error" role="status">
                    {status.message}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
