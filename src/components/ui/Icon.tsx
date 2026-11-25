import type { ReactNode, SVGProps } from "react";

// Jeu d'icônes à trait fin, volontairement sobre. Tout est dessiné sur une grille 24 × 24.
const ICONS = {
  home: <path d="M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  photo: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4 18l5-5 4 4 2.5-2.5L20 18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  tasks: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M8 12.2l2.7 2.7L16 9.6" />
    </>
  ),
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  logout: <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10M14 8l4 4-4 4M18 12H9.5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="3" />
      <path d="M15.5 8.5V7A2.5 2.5 0 0 0 13 4.5H7A2.5 2.5 0 0 0 4.5 7v6A2.5 2.5 0 0 0 7 15.5h1.5" />
    </>
  ),
  swap: <path d="M5 8h13l-3-3M19 16H6l3 3" />,
  heart: <path d="M12 20.5s-7.5-4.6-9.5-9.3C1.1 7.8 3.3 4.5 6.8 4.5c2.2 0 3.7 1.3 5.2 3 1.5-1.7 3-3 5.2-3 3.5 0 5.7 3.3 4.3 6.7-2 4.700-9.500 9.300-9.500 9.300z" />,
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.4-3.2 2.7-5 5.5-5s5.1 1.8 5.5 5" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M16.5 14.2c2.5-.2 4.2 1.4 4.5 4.3" />
    </>
  ),
  house: (
    <>
      <path d="M4 11l8-6.5 8 6.5v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M10 20.5v-5.5h4v5.5" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 14c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5.5A2.5 2.5 0 0 0 8 9.5M16 6h2.5A2.5 2.5 0 0 1 16 9.5M12 13v4M8.5 20h7" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="2.5" />
      <path d="M12 9v11M3.5 13h17M12 9C11 5.5 6.5 5 6.5 7.5S10 9 12 9zm0 0c1-3.5 5.5-4 5.5-1.5S14 9 12 9z" />
    </>
  ),
  capsule: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="7" />
      <path d="M5 12h14" />
    </>
  ),
  archive: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  album: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="3.5" />
      <path d="M7 4h10" />
    </>
  ),
  bulb: <path d="M9 18h6M10 21h4M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3.5z" />,
  sparkle: <path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z" />,
  star: <path d="M12 4l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.400 6.500 11 6.500 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.5-3.8 3.300-6 7-6s6.500 2.200 7 6" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3.5" />
      <path d="M4.500 8l7.500 5.500L19.500 8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3.500v2M12 18.500v2M3.500 12h2M18.500 12h2M6 6l1.400 1.400M16.600 16.600L18 18M6 18l1.400-1.400M16.600 7.400L18 6" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  logo: (
    <>
      <circle cx="9.500" cy="12" r="6.500" />
      <circle cx="14.500" cy="12" r="6.500" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  sendUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  reply: <path d="M10 7L5 12l5 5M5 12h9a5 5 0 0 1 5 5v1" />,
  refresh: <path d="M20 11a8 8 0 0 0-14.9-3.9L4 9M4 4v5h5M4 13a8 8 0 0 0 14.9 3.9L20 15M20 20v-5h-5" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />,
  bell: <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5h4" />,
  trash: <path d="M5 7h14M9.5 7V5h5v2M7 7l.8 12h8.4L17 7" />,
  edit: <path d="M5 19l1-4 9.5-9.5a2 2 0 0 1 2.8 2.8L8.8 17.8z" />,
  video: (
    <>
      <rect x="3.5" y="6.5" width="12" height="11" rx="3" />
      <path d="M15.5 10.5l5-2.5v8l-5-2.5" />
    </>
  ),
  flame: <path d="M12 3.5c1 3-3.5 4.7-3.5 8.8a3.5 3.5 0 0 0 7 0c0-1.2-.4-2.1-1-3 2.4 1 4 3 4 5.4a6.5 6.5 0 0 1-13 0c0-5.2 5-6.2 6.5-11.2z" />,
  gallery: (
    <>
      <rect x="3.5" y="6.5" width="14" height="13" rx="3.5" />
      <path d="M7 4h13a1 1 0 0 1 1 1v11M6.5 16l3.5-3.5 2.5 2.5 2-2 2 2" />
    </>
  ),
  play: <path d="M8.500 5.500v13l10.500-6.500z" fill="currentColor" />,
  pause: (
    <>
      <rect x="7" y="5" width="3.500" height="14" rx="1.200" fill="currentColor" />
      <rect x="13.500" y="5" width="3.500" height="14" rx="1.200" fill="currentColor" />
    </>
  ),
  bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />,
  upload: <path d="M12 16V4M7.500 8.500L12 4l4.500 4.500M5 14v4.500A1.500 1.500 0 0 0 6.500 20h11a1.500 1.500 0 0 0 1.500-1.500V14" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & { name: IconName; size?: number; strokeWidth?: number };

export function Icon({ name, size = 22, strokeWidth = 1.75, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}
