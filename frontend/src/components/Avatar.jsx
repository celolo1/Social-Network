import React from 'react';

const buildInitials = (firstName, lastName) => {
  const a = String(firstName || '').trim().charAt(0).toUpperCase();
  const b = String(lastName || '').trim().charAt(0).toUpperCase();
  const initials = `${a}${b}`.trim();
  return initials || 'U';
};

export default function Avatar({ src, firstName, lastName, size = 40 }) {
  const initials = buildInitials(firstName, lastName);
  const style = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName || ''} ${lastName || ''}`.trim() || 'User avatar'}
        className="avatar-image"
        style={style}
      />
    );
  }

  return (
    <div className="avatar-fallback" style={style} aria-label="User avatar">
      {initials}
    </div>
  );
}
