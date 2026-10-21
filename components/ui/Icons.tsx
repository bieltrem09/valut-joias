import { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const IconSearch = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>);
export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (<svg {...base} {...p}><path fill={filled ? 'currentColor' : 'none'} d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" /></svg>);
export const IconBag = (p: P) => (<svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>);
export const IconArrow = (p: P) => (<svg {...base} {...p}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>);
export const IconArrowLeft = (p: P) => (<svg {...base} {...p}><path d="M20 12H4m6-6-6 6 6 6" /></svg>);
export const IconClose = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconPlus = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const IconMinus = (p: P) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>);
export const IconInstagram = (p: P) => (<svg {...base} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></svg>);
export const IconWhatsapp = (p: P) => (<svg {...base} {...p}><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1L4 20Z" /><path d="M9 9.5c0 2.8 2.7 5.5 5.5 5.5l1-1.5-1.8-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.8L9 9.5Z" /></svg>);
export const IconPin = (p: P) => (<svg {...base} {...p}><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const IconSpark = (p: P) => (<svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden {...p}><path d="M12 2c.6 4.8 2.2 7.4 10 10-7.8 2.6-9.4 5.2-10 10-.6-4.8-2.2-7.4-10-10 7.8-2.6 9.4-5.2 10-10Z" /></svg>);
export const IconTrash = (p: P) => (<svg {...base} {...p}><path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7" /><path d="M10.5 10.5v5M13.5 10.5v5" /></svg>);
export const IconTruck = (p: P) => (<svg {...base} {...p}><path d="M3 7h11v9H3zM14 10h3.5l2.5 3v3h-6" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>);
export const IconShield = (p: P) => (<svg {...base} {...p}><path d="M12 3.5 19 6v5.5c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6l7-2.5Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconLock = (p: P) => (<svg {...base} {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>);
