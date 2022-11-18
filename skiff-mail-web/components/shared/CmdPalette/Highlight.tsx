import { themeNames, Typography } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

const SearchText = styled.span`
  color: ${themeNames.dark['--icon-link']};
`;
interface Props {
  text: string;
  query: string;
  size?: 'large' | 'small';
  sender?: string;
  read?: boolean;
}

export const Highlight = ({ text, query, size = 'large', sender, read }: Props) => {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  const level = size === 'large' ? 2 : 3;

  const isSubject = !sender;
  // use read === false and not !read because if read is undefined, then the search result is not an email
  const type = read === false && isSubject ? 'label' : 'paragraph';
  const color = read === false ? 'primary' : 'secondary';

  if (index < 0) {
    return (
      <Typography color={color} dataTest='highlight' level={level} themeMode='dark' type={type}>
        {text}
      </Typography>
    );
  }

  return (
    <Typography color={color} level={level} themeMode='dark' type={type}>
      {sender && `${sender} – `}
      <span>{text.slice(0, index)}</span>
      <SearchText>{text.slice(index, index + query.length)}</SearchText>
      <span>{text.slice(index + query.length)}</span>
    </Typography>
  );
};
