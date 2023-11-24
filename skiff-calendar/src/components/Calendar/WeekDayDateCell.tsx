import { colors, Typography, TypographySize } from 'nightwatch-ui';
import { FC } from 'react';
import styled from 'styled-components';

const HeadingCellContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: default;
  padding: 0 0 8px 0;
  background: var(--bg-l2-solid);
`;

const StyledText = styled.div<{ $isSelectedDay: boolean; $isToday: boolean }>`
  padding: 4px 8px;
  ${(props) => props.$isSelectedDay && !props.$isToday && `color: rgb(${colors['--orange-500']});`}
  ${(props) =>
    props.$isToday &&
    `background: rgb(${colors['--orange-500']});
     border-radius: 8px;
    `}
`;

interface WeekDayDateCellProps {
  isToday: boolean;
  selectedDay: boolean;
}

export const WeekDayDateCell: FC<WeekDayDateCellProps> = ({ children, isToday, selectedDay }) => {
  return (
    <HeadingCellContainer>
      <Typography color={isToday ? 'white' : 'secondary'} mono size={TypographySize.SMALL}>
        <StyledText $isSelectedDay={selectedDay} $isToday={isToday}>
          {children}
        </StyledText>
      </Typography>
    </HeadingCellContainer>
  );
};
