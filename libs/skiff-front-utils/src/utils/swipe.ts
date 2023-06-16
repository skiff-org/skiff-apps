export const isSwipeHorizontal = (touchStartX: number, touchStartY: number, currentX: number, currentY: number) => {
  const touchDifference = touchStartX - Number(currentX);
  const touchDifferenceY = Math.abs(touchStartY - Number(currentY));
  const touchLength = Math.abs(touchDifference);

  return touchDifferenceY < touchLength;
};
