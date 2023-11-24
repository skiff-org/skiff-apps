import { Size, TypographySize } from 'nightwatch-ui';

export type KeyCodeSequenceSize = Size.SMALL | Size.MEDIUM | Size.LARGE;

export interface KeyCodeSequenceProps {
  shortcut: string;
  size?: KeyCodeSequenceSize;
}

export const TYPOGRAPHY_SIZE = {
  xsmall: TypographySize.CAPTION,
  small: TypographySize.CAPTION,
  medium: TypographySize.SMALL,
  large: TypographySize.MEDIUM
};
