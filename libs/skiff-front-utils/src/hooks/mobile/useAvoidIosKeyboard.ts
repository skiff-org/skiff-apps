import React, { useCallback, useEffect, useState } from 'react';

const GAP = 45; // the gap between the keyboard and the next btn including the autocomplete section

export const useAvoidIosKeyboard = (
  avoidingElementRef: React.RefObject<HTMLDivElement> | undefined,
  defaultMargin: number,
  keyboardHeight: number,
  spacerRenderer?: (margin: number) => JSX.Element
) => {
  // because every time we change the margin, the bottom shifts,
  // we store the highest space from bottom and thus keep the btn above the keyboard
  const [NextBtnBottom, setNextBtnBottom] = useState(0);

  useEffect(() => {
    if (!avoidingElementRef || !avoidingElementRef.current) return;
    const currentNextBottom = avoidingElementRef.current.getBoundingClientRect().bottom;
    setNextBtnBottom(currentNextBottom);
    // lint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const calcMarginNextButton = useCallback(() => {
    if (!keyboardHeight || !avoidingElementRef || !avoidingElementRef.current)
      return spacerRenderer ? spacerRenderer(defaultMargin) : defaultMargin;
    const bottom = window.innerHeight - NextBtnBottom; // get the distance of the next btn from the bottom
    const margin = bottom - keyboardHeight; // the margin that needs to be added to the btn container.
    const calculatedMargin = margin < 0 ? defaultMargin + margin - GAP : defaultMargin;
    return spacerRenderer ? spacerRenderer(calculatedMargin) : calculatedMargin;
    // lint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidingElementRef, defaultMargin, NextBtnBottom, spacerRenderer]);
  return calcMarginNextButton;
};
