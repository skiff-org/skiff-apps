import { css } from 'styled-components';

import { ThemeMode } from './types';
import { getThemedColor } from './utils/colorUtils';

/** Keeps scrollbar displayed */
export const DISPLAY_SCROLLBAR_CSS = css`
  /* This will change the scrollbar track */
  ::-webkit-scrollbar {
    width: 12px;
  }

  /* This is the scrollbar thumb */
  ::-webkit-scrollbar-thumb {
    background: ${({ forceTheme }: { forceTheme?: ThemeMode }) => getThemedColor('var(--border-primary)', forceTheme)};

    border-radius: 20px; /* roundness of the scroll thumb */
    border: 3px solid transparent; /* creates padding around scroll thumb */
    background-clip: content-box; /* ensures padding doesn't take on the background color */
  }

  /* Button at the top and bottom */
  ::-webkit-scrollbar-button {
    display: none;
  }

  /* When you hover over the scrollbar */
  ::-webkit-scrollbar-thumb:hover {
    color: ${({ forceTheme }: { forceTheme?: ThemeMode }) => getThemedColor('var(--cta-secondary-hover)', forceTheme)};
  }
`;

/** Hides scrollbar */
export const REMOVE_SCROLLBAR_CSS = css`
  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Hide scrollbar for IE and Edge */
  -ms-overflow-style: none;

  /* Hide scrollbar for Firefox */
  scrollbar-width: none;
`;

/** Component will have the same width and height */
export const SQUARE_CSS = css`
  ${({ $size }: { $size: number }) => `
    width: ${$size}px;
    height: ${$size}px;
  `}
`;
