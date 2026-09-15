// Backup-panel glyphs. Same construction as the bottom-nav and profile-menu
// icons: stroke-only, inheriting `currentColor`, drawn on a 24x24 grid at 1.7
// weight, so the header button reads as the same hand as the rest of the
// app's chrome.

type IconProps = { className?: string; size?: number };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/*
 * The header button's mark: a domed-lid treasure chest with a clasp straddling
 * the seam. Deliberately only four strokes — a dome, the body, the clasp plate
 * and a keyhole — because the corner straps a "realistic" chest wants turn to
 * mud at the 22px this actually renders at.
 */
export function ChestIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M3.4 10.9V9.7c0-3.1 3.9-5.6 8.6-5.6s8.6 2.5 8.6 5.6v1.2" />
      <rect x="3.4" y="10.9" width="17.2" height="8.6" rx="1.6" />
      <rect x="10.2" y="9.6" width="3.6" height="4.2" rx="1" />
      <path d="M12 15.4v1.4" />
    </svg>
  );
}

/** A tray with an arrow coming down into it — the backup direction: out of
 *  the app, down onto the device. */
export function DownloadIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 3.8v10.4" />
      <path d="M7.8 10.2L12 14.4l4.2-4.2" />
      <path d="M4.6 16.2v2.2a1.8 1.8 0 0 0 1.8 1.8h11.2a1.8 1.8 0 0 0 1.8-1.8v-2.2" />
    </svg>
  );
}

/** The same tray with the arrow coming back up out of it — the restore
 *  direction. Mirrored on purpose, so the pair reads as one movement in two
 *  directions rather than as two unrelated marks. */
export function UploadIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 14.2V3.8" />
      <path d="M7.8 8L12 3.8 16.2 8" />
      <path d="M4.6 16.2v2.2a1.8 1.8 0 0 0 1.8 1.8h11.2a1.8 1.8 0 0 0 1.8-1.8v-2.2" />
    </svg>
  );
}

/** Warning triangle for the restore confirmation. */
export function AlertIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 4.2l8.2 14.2H3.8z" />
      <path d="M12 9.6v3.8" />
      <path d="M12 16.2h.02" />
    </svg>
  );
}
