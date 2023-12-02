import { TypographySize } from '../../Typography';
import { InputFieldSize } from '../InputField.types';

/** Maps InputFieldSize to sub-text size */
export const SUB_TEXT_SIZE: Record<InputFieldSize, TypographySize> = {
  xsmall: TypographySize.CAPTION,
  small: TypographySize.SMALL,
  medium: TypographySize.SMALL,
  large: TypographySize.MEDIUM
};
