// Profile-menu glyphs. Same construction as the bottom-nav icons: stroke-only,
// inheriting `currentColor`, drawn on a 24x24 grid at 1.7 weight, so the panel
// reads as the same hand as the rest of the app's chrome.

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
 * The header button's mark: a bust inside a ring, sized so the shoulders stop
 * just inside the ring rather than colliding with it. The ring is the same
 * drawn circle the Reminders clock uses, which is what keeps this from
 * reading as a generic pasted-in avatar.
 */
export function ProfileAvatarIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.4" />
      <circle cx="12" cy="9.6" r="3.1" />
      <path d="M6.7 19c0-3.1 2.4-5.1 5.3-5.1s5.3 2 5.3 5.1" />
    </svg>
  );
}

export function PersonIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M5 20c0-3.7 3.1-5.9 7-5.9s7 2.2 7 5.9" />
    </svg>
  );
}

export function HelpIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.7.3-1 .9-1 1.6v.4" />
      <path d="M11.9 17.3h.02" />
    </svg>
  );
}

export function ShieldIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 3.2l6.6 2.5v5.5c0 4.2-2.7 7.7-6.6 9.3-3.9-1.6-6.6-5.1-6.6-9.3V5.7z" />
      <path d="M9.2 12.1l2 2 3.6-3.9" />
    </svg>
  );
}

/** A serif capital T — the printer's mark for type, rather than a literal
 *  "Aa" (which would be text, not a stroke glyph, and would not inherit the
 *  same weight as everything around it). */
export function TypeIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      <path d="M4.6 8.6V6h14.8v2.6" />
      <path d="M12 6v12.4" />
      <path d="M8.9 18.4h6.2" />
    </svg>
  );
}
