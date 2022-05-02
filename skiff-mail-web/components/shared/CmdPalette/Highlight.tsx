import { Typography } from '@skiff-org/skiff-ui';
import React from 'react';

interface Props {
  text: string;
  query: string;
  size?: 'large' | 'small';
  sender?: string;
}

export const Highlight = ({ text, query, size = 'large', sender }: Props) => {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  const level = size === 'large' ? 2 : 3;

  if (index < 0) {
    return (
      <Typography dataTest='highlight' level={level} themeMode='dark' type='paragraph'>
        {text}
      </Typography>
    );
  }

  return (
    <>
      <Typography color='secondary' themeMode='dark' type='paragraph'>
        {sender && `${sender} – `}
        <span>{text.slice(0, index)}</span>
        <span style={{ color: 'rgb(255, 142, 120)' }}>{text.slice(index, index + query.length)}</span>
        <span>{text.slice(index + query.length)}</span>
      </Typography>
    </>
  );
};
