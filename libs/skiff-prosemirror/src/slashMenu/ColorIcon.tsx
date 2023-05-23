import React from 'react';

const getColorIcon = (color: string) => {
  // TODO: update to use theme
  const isWhite = color === 'var(--text-inverse)';
  const isTransparent = color === 'var(--editor-highlight-transparent)';
  const style = {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    marginRight: '16px',
    border: isWhite || isTransparent ? '1px solid #bfbfbf' : 'none',
    background: isTransparent
      ? 'linear-gradient(to bottom right, transparent calc(50% - 1px), red calc(50% - 1px), red calc(50% + 1px), transparent calc(50% + 1px))'
      : color
  };

  return <div style={style} />;
};

export default getColorIcon;
