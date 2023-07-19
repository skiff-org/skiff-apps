import { Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

type TitleSectionProps = {
  title?: string;
  subtitle?: string;
  destructive?: boolean;
};

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
`;

/**
 * Component that renders a name and description of the setting
 */
export default function TitleSection(props: TitleSectionProps) {
  const { title, subtitle, destructive } = props;
  if (!title && !subtitle) return null;
  return (
    <TitleBlock>
      {title && (
        <Typography
          mono
          uppercase
          color={destructive ? 'destructive' : 'primary'}
          weight={isMobile ? TypographyWeight.MEDIUM : undefined}
          wrap
        >
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography mono uppercase color='secondary' wrap>
          {subtitle}
        </Typography>
      )}
    </TitleBlock>
  );
}
