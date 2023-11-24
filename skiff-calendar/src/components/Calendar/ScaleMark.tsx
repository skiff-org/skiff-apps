import range from 'lodash/range';
import { Typography, TypographySize } from 'nightwatch-ui';
import { FC, memo } from 'react';
import { isMobile } from 'react-device-detect';
import { hourFormatParser, useUserPreference } from 'skiff-front-utils';
import { HourFormats } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { MARK_HOURS_MARGIN_RIGHT } from '../../constants/calendar.constants';
import { HOURS_IN_DAY } from '../../constants/time.constants';
import { hourToFormatString } from '../../utils';

const CenteredTimeContainer = styled.div`
  background-color: var(--bg-l2-solid);
  box-sizing: border-box;
  margin-right: ${MARK_HOURS_MARGIN_RIGHT}px;
`;

const AbsoluteTimeContainer = styled.div`
  position: absolute;
  bottom: 0;
  transform: translateY(50%);
  width: 100%;
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const ScaleCellContainer = styled.div`
  box-sizing: border-box;
  height: 100%;
  position: relative;
`;

const ScaleMarkContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  position: relative;
`;

const TabularType = styled.div`
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
`;

const ScaleMark: FC = () => {
  const [userHourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);
  const defaultHourFormat = isMobile ? HourFormats.Short : HourFormats.Long;
  const isShortFormat = true;
  const selectedHourFormat = userHourFormat
    ? hourFormatParser(userHourFormat, isShortFormat)
    : defaultHourFormat;
  return (
    <ScaleMarkContainer onMouseDown={(e) => e.stopPropagation()}>
      {range(HOURS_IN_DAY).map((value) => (
        <ScaleCellContainer key={value}>
          <AbsoluteTimeContainer>
            <CenteredTimeContainer>
              {value !== HOURS_IN_DAY - 1 && (
                <Typography color='disabled' mono size={TypographySize.SMALL}>
                  <TabularType>{hourToFormatString(value + 1, selectedHourFormat)}</TabularType>
                </Typography>
              )}
            </CenteredTimeContainer>
          </AbsoluteTimeContainer>
        </ScaleCellContainer>
      ))}
    </ScaleMarkContainer>
  );
};

export default memo(ScaleMark);
