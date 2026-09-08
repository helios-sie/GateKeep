// Bottom-nav glyphs. Stroke-only, inherit `currentColor` so the active tab
// tint comes from CSS. 24x24 viewBox, drawn at 22px.

type IconProps = { className?: string };

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function ChecklistIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 5.7l1.4 1.4L8 4.5" />
      <path d="M4 11.7l1.4 1.4L8 10.5" />
      <path d="M4 17.7l1.4 1.4L8 16.5" />
    </svg>
  );
}

export function NotebookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H7z" />
      <path d="M7 3.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2" />
      <path d="M10 8h5M10 12h5" />
    </svg>
  );
}
