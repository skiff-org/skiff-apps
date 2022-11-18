export const isSwipeHorizontal = (touchStartX, touchStartY, currentX, currentY) => {
  const touchDifference = touchStartX - Number(currentX);
  const touchDifferenceY = Math.abs(touchStartY - Number(currentY));
  const touchLength = Math.abs(touchDifference);

  return touchDifferenceY < touchLength;
};
