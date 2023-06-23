import { ThemeMode, themeNames, Typography, TypographyProps, TypographyWeight } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

const SearchText = styled.span<{ $isAction?: boolean }>`
  color: ${({ $isAction }) => ($isAction ? themeNames.dark['--text-primary'] : themeNames.dark['--text-link'])};
`;
interface Props {
  text: string;
  query: string;
  size?: 'large' | 'small';
  sender?: string;
  read?: boolean;
  customColor?: TypographyProps['color'];
  isAction?: boolean;
}

export const Highlight = ({ isAction, text, query, sender, read, customColor }: Props) => {
  const index = text.toLowerCase().indexOf(query.toLowerCase());

  const isSubject = !sender;
  // use read === false and not !read because if read is undefined, then the search result is not an email
  const typographyWeight = read === false && isSubject ? TypographyWeight.MEDIUM : TypographyWeight.REGULAR;
  const color = read === false ? 'primary' : 'secondary';
  const textColor = customColor ?? color;

  if (index < 0) {
    return (
      <Typography color={textColor} dataTest='highlight' forceTheme={ThemeMode.DARK} weight={typographyWeight}>
        {text}
      </Typography>
    );
  }

  return (
    <Typography color={textColor} forceTheme={ThemeMode.DARK} weight={typographyWeight}>
      {sender && `${sender} – `}
      <span>{text.slice(0, index)}</span>
      <SearchText $isAction={isAction}>{text.slice(index, index + query.length)}</SearchText>
      <span>{text.slice(index + query.length)}</span>
    </Typography>
  );
};
