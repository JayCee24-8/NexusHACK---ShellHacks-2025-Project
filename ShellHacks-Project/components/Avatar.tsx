import React from 'react';

interface AvatarProps {
  src?: string;
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-24 h-24 text-3xl',
};

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const hashNameToColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 50%, 40%)`;
    return color;
}

export const Avatar: React.FC<AvatarProps> = ({ src, fullName, size = 'md' }) => {
  const sizeClass = sizeClasses[size] || sizeClasses['md'];

  if (src) {
    return (
      <img
        src={src}
        alt={fullName}
        className={`${sizeClass} rounded-full object-cover bg-shell-bg`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: hashNameToColor(fullName) }}
      aria-label={fullName}
    >
      {getInitials(fullName)}
    </div>
  );
};