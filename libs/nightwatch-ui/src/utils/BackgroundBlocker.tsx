import styled from 'styled-components';

/**
 * This component is used to create an invisible mask behind another
 * component, e.g. an option menu, so that all background scrolling and
 * events can be easily disabled. Uses the same zindex as Mui dialog to let
 * the order in the DOM (order of insert) determine which dialog shows on top.
 * This is the same logic as scrim, given that this is a kind of invisible scrim
 */

const BackgroundBlocker = styled.div<{ $top?: number; $left?: number }>`
  position: fixed;
  top: ${({ $top }: { $top?: number }) => `${$top ?? 0}px`};
  left: ${({ $left }: { $left?: number }) => `${$left ?? 0}px`};
  height: 100vh;
  width: 100vw;
  z-index: 1300;
`;

export default BackgroundBlocker;
