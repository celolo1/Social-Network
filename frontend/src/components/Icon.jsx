import React from 'react';

const iconPaths = {
  home: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z',
  feed: 'M4 5h16M4 12h16M4 19h10',
  people: 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 2a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 1c-3.3 0-6 2-6 4.5V21h12v-2.5C22 16 19.3 14 16 14Zm-8 1c-2.8 0-5 1.8-5 4V21h6v-1.2a5.8 5.8 0 0 1 2.4-4.7A8.8 8.8 0 0 0 8 15Z',
  profile: 'M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.4 0-8 2.5-8 5.5V21h16v-1.5c0-3-3.6-5.5-8-5.5Z',
  message: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z',
  story: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm6 4.5a3.5 3.5 0 1 0 3.5 3.5A3.5 3.5 0 0 0 12 7.5Zm5.5-2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z',
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm5.1 11.6L21 21',
  send: 'M3 12 21 3l-6 18-3.5-6.5L3 12Z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M5 7h14M9 7v-2h6v2M8 10v8M12 10v8M16 10v8M6 7l1 14h10l1-14',
  like: 'M12 21s-7.5-4.5-9.4-8.5A5.6 5.6 0 0 1 7.7 4a5.7 5.7 0 0 1 4.3 2 5.7 5.7 0 0 1 4.3-2 5.6 5.6 0 0 1 5.1 8.5C19.5 16.5 12 21 12 21Z',
  comment: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  image: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm2 10 3-3 2.5 2.5L15 11l3 4',
  logout: 'M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M14 8l4 4-4 4M18 12H9'
};

export default function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const path = iconPaths[name] || iconPaths.home;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
