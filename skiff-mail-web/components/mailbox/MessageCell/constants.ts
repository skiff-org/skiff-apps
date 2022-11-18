// The px require to start swiping
const TOUCH_THRESHOLD = 0;
// The px require to swipe for complete the action
const COMPLETE_ACTION_THRESHOLD = 120;
// Duration in ms of return to normal animation
const SWIPE_TRANSITION_DURATION = 300;
const swipeTransition = `${SWIPE_TRANSITION_DURATION / 1000}s cubic-bezier(0.3, 0, 0.5, 1)`;
// Duration of the animation is miliseconds
const MULT_SELECT_TRANSITION_DURATION = 300;
// How much to move the to move in x axis when opening multiple select
const MULT_SELECT_TRANSLATE = 30;
// How long till long touch is triggered in ms
const LONG_TOUCH_DURATION = 300;

export {
  TOUCH_THRESHOLD,
  COMPLETE_ACTION_THRESHOLD,
  SWIPE_TRANSITION_DURATION,
  MULT_SELECT_TRANSITION_DURATION,
  swipeTransition,
  MULT_SELECT_TRANSLATE,
  LONG_TOUCH_DURATION
};
