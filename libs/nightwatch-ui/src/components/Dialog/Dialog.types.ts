import { Layout, ThemeMode } from '../../types';
import { ButtonGroupItemComponent } from '../ButtonGroupItem';
import { InputComponent, TextAreaComponent } from '../InputField';
import { SurfaceProps } from '../Surface';
import { TypographySize } from '../Typography';

export enum DialogType {
  CONFIRM = 'confirm',
  DEFAULT = 'default',
  INPUT = 'input',
  PROMOTIONAL = 'promotional',
  SEARCH = 'search',
  SETTINGS = 'settings',
  LANDSCAPE = 'landscape'
}

export interface DialogProps {
  /** Dialog button content or other custom content */
  children: ButtonGroupItemComponent[] | React.ReactNode;
  /** Dialog opened / closed state */
  open: boolean;
  /** Closes the dialog */
  onClose: () => Promise<void> | void;
  /** Classes to ignore on off-click */
  classesToIgnore?: string[];
  /** For styled components */
  className?: string;
  /** E2E indicator for close button */
  closeBtnDataTest?: string;
  /** Whether dialog has custom non-button content */
  customContent?: boolean;
  /** E2E indicator for dialog */
  dataTest?: string;
  /** Description text */
  description?: string;
  /** Disables off-click */
  disableOffClick?: boolean;
  /** Disables text selection */
  disableTextSelect?: boolean;
  /** Custom dialog theme */
  forceTheme?: ThemeMode;
  /** Custom height */
  height?: number | string;
  /** Hides close button */
  hideCloseButton?: boolean;
  /** Input content */
  inputField?: Array<InputComponent | TextAreaComponent> | InputComponent | TextAreaComponent;
  /** Dialog loading state */
  loading?: boolean;
  /** Disables padding */
  noPadding?: boolean;
  /** Progress bar controls */
  progress?: {
    totalNumSteps: number;
    currStep: number;
  };
  /** Custom size */
  size?: SurfaceProps['size'];
  /** For customization */
  style?: React.CSSProperties;
  /** Title text */
  title?: string;
  /** Dialog type */
  type?: DialogType;
  /** Custom width */
  width?: number | string;
  /** Custom z-index */
  zIndex?: number;
}

export type DialogTypeStyles = {
  size: SurfaceProps['size'];
  className?: string;
  fullWidth?: boolean;
  layout?: Layout;
  showCloseButton?: boolean;
  titleSize?: TypographySize;
};
