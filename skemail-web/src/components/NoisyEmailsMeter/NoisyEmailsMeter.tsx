import {
  Icon,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight,
  colors,
  getThemedColor
} from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

const TitleDismiss = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Segment = styled.div<{ $bgColor: string; $isStart?: boolean; $isEnd?: boolean; $forceTheme?: ThemeMode }>`
  width: 100%;
  height: 4px;
  border-radius: ${(props) => (props.$isStart ? '100px 0 0 100px' : props.$isEnd ? '0 100px 100px 0' : '0')};
  background-color: ${(props) =>
    props.$forceTheme ? getThemedColor(props.$bgColor, props.$forceTheme) : props.$bgColor};
`;

const Segments = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 2px;
`;

const LowOpacity = styled.span`
  opacity: 0.6;
`;

const MeterContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;
`;

const SEGMENT_COLORS = [
  `rgb(${colors['--orange-100']})`,
  `rgb(${colors['--orange-200']})`,
  `rgb(${colors['--orange-400']})`,
  `rgb(${colors['--orange-500']})`,
  'var(--bg-overlay-primary)'
];

interface NoisyEmailsMeterProps {
  numNoisyEmails: number;
  numTotalEmails?: number;
  dismiss?: () => void;
  forceTheme?: ThemeMode;
}

/**
 * Meter for showing the number of noisy emails
 */
export const NoisyEmailsMeter: React.FC<NoisyEmailsMeterProps> = ({
  numNoisyEmails,
  numTotalEmails,
  dismiss,
  forceTheme
}: NoisyEmailsMeterProps) => {
  const showNumTotalEmails = numTotalEmails && numNoisyEmails <= numTotalEmails;
  return (
    <MeterContainer>
      <TitleDismiss>
        <Typography
          color='link'
          forceTheme={forceTheme}
          mono
          size={TypographySize.CAPTION}
          uppercase
          weight={TypographyWeight.MEDIUM}
        >
          {`${numNoisyEmails.toLocaleString()} noisy${!showNumTotalEmails ? ' emails' : ' '}`}
          {showNumTotalEmails && <LowOpacity>/ {numTotalEmails.toLocaleString()} EMAILS</LowOpacity>}
        </Typography>
        {dismiss && (
          <IconText
            color='disabled'
            forceTheme={forceTheme}
            onClick={dismiss}
            size={Size.SMALL}
            startIcon={Icon.Close}
          />
        )}
      </TitleDismiss>
      {!!numNoisyEmails && (
        <Segments>
          {SEGMENT_COLORS.map((color, index) => (
            <Segment
              $bgColor={color}
              $forceTheme={forceTheme}
              $isEnd={index === SEGMENT_COLORS.length - 1}
              $isStart={index === 0}
              key={color}
            />
          ))}
        </Segments>
      )}
    </MeterContainer>
  );
};
