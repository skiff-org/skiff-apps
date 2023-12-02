import { isMobile } from 'react-device-detect';

import { Layout, Size } from '../../types';
import { CONFIRM_MODAL_CLASSNAME } from '../Surface';
import { TypographySize } from '../Typography';

import { DialogType, DialogTypeStyles } from './Dialog.types';

export const MOBILE_CONFIRM_MODAL_MIN_WIDTH = 287;
export const MOBILE_CONFIRM_MODAL_MAX_WIDTH = 340;

export const DIALOG_TYPE_STYLES: Record<DialogType, DialogTypeStyles> = {
  confirm: {
    size: Size.SMALL,
    className: CONFIRM_MODAL_CLASSNAME,
    fullWidth: true,
    layout: Layout.INLINE,
    titleSize: isMobile ? TypographySize.LARGE : TypographySize.H4
  },
  default: {
    size: Size.X_MEDIUM,
    showCloseButton: true
  },
  input: {
    size: Size.X_SMALL
  },
  promotional: {
    size: Size.MEDIUM,
    fullWidth: true,
    layout: Layout.STACKED,
    showCloseButton: true
  },
  search: {
    size: 'full-width'
  },
  landscape: {
    size: Size.LARGE
  },
  settings: {
    size: Size.X_LARGE
  }
};
