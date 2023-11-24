import { isMobile } from 'react-device-detect';

const ALL_DAY_WIDTH_OFFSET = 13;
// aligning the all day events widths correctly
export const getAllDayEventCardWidth = (width: number, isLastDayInAllDayEvent: boolean) => {
  if (isMobile) {
    return isLastDayInAllDayEvent ? `calc(100% - ${ALL_DAY_WIDTH_OFFSET - 1}px);` : `100%;`;
  }
  return `calc((100% * ${width}) - ${ALL_DAY_WIDTH_OFFSET - width}px);`;
};
