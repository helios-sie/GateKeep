import { useEffect, useState } from 'react';
import { ChevronLeftIcon, CloseIcon } from '../icons';
import { HelpIcon, PersonIcon, ProfileAvatarIcon, ShieldIcon, TypeIcon } from './icons';
import './ProfileMenu.css';

type Section = (typeof SECTIONS)[number]['id'];

const SECTIONS = [
  {
    id: 'profile',
    label: 'Profile',
    Icon: PersonIcon,
    blurb: 'Your name, and how the app greets you.',
    body: 'Nothing to set up yet — this is where your name and details will live once profiles are built.',
  },
  {
    id: 'help',
    label: 'How to use this app',
    Icon: HelpIcon,
    blurb: 'Tasks, entries, reminders — the short version.',
    body: 'A walkthrough of the three pages, the week strip, and swiping between days will go here.',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    Icon: ShieldIcon,
    blurb: 'Where your writing is kept.',
    body: 'Everything you write stays on this device, in the browser’s own storage. The details will be spelled out here.',
  },
  {
    id: 'fonts',
    label: 'Fonts',
    Icon: TypeIcon,
    blurb: 'The hand your entries are written in.',
    body: 'A choice of writing faces for your entries will go here.',
  },
] as const;

const CLOSE_MS = 220;

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [section, setSection] = useState<Section | null>(null);

  function open() {
    setSection(null);
    setIsOpen(true);
  }

  function close() {
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
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const active = SECTIONS.find((s) => s.id === section);

  return (
    <>
      <button
        type="button"
        className={isOpen && !isClosing ? 'profile-button is-open' : 'profile-button'}
        onClick={open}
        aria-label="Profile and settings"
        aria-haspopup="dialog"
        aria-expanded={isOpen && !isClosing}
      >
        <ProfileAvatarIcon />
      </button>

      {isOpen && (
        <div className={isClosing ? 'profile-menu is-closing' : 'profile-menu'}>
          <button
            type="button"
            className="profile-scrim"
            aria-label="Close profile and settings"
            onClick={close}
          />

          <aside className="profile-panel" role="dialog" aria-modal="true" aria-label="Profile and settings">
            <header className="profile-panel-head">
              {active ? (
                <button
                  type="button"
                  className="profile-panel-icon-button"
                  aria-label="Back to menu"
                  onClick={() => setSection(null)}
                >
                  <ChevronLeftIcon width={20} height={20} />
                </button>
              ) : (
                <span className="profile-panel-seal" aria-hidden="true">
                  <ProfileAvatarIcon size={26} />
                </span>
              )}

              <h2>{active ? active.label : 'GateKeep'}</h2>

              <button type="button" className="profile-panel-icon-button" aria-label="Close" onClick={close}>
                <CloseIcon width={20} height={20} />
              </button>
            </header>

            {active ? (
              <div className="profile-section">
                <p className="profile-section-body">{active.body}</p>
              </div>
            ) : (
              <nav className="profile-list" aria-label="Profile and settings">
                {SECTIONS.map(({ id, label, Icon, blurb }) => (
                  <button key={id} type="button" className="profile-list-item" onClick={() => setSection(id)}>
                    <Icon className="profile-list-glyph" />
                    <span className="profile-list-text">
                      <span className="profile-list-label">{label}</span>
                      <span className="profile-list-blurb">{blurb}</span>
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
