import React from 'react';

export function getSlideContrastStyles(contrastTheme: 'auto' | 'light' | 'dark') {
  const headlineStyle: React.CSSProperties =
    contrastTheme === 'light'
      ? { color: '#09090b' }
      : contrastTheme === 'dark'
        ? { color: '#ffffff' }
        : {};

  const taglineStyle: React.CSSProperties =
    contrastTheme === 'light'
      ? { color: '#334155' }
      : contrastTheme === 'dark'
        ? { color: '#e2e8f0' }
        : {};

  const badgeStyle: React.CSSProperties =
    contrastTheme === 'light'
      ? { color: '#09090b' }
      : contrastTheme === 'dark'
        ? { color: '#ffffff' }
        : {};

  return { headlineStyle, taglineStyle, badgeStyle };
}
