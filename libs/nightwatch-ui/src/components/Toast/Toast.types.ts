import { SnackbarKey } from 'notistack';

import { Icon } from '../Icons';

type ToastCTA = {
  label: string;
  onClick: (toastKey?: SnackbarKey) => Promise<void> | void;
};

/**
 * Fields to control toast behavior.
 */
export interface ToastProps {
  /** CTAs */
  actions?: ToastCTA[];
  /** Main text for toast */
  body?: string;
  /** E2E test selector */
  dataTest?: string;
  /** Number of ms to wait before closing toast (if persist is false) */
  duration?: number;
  /** Optional icon, rendered at the start of the toast */
  icon?: Icon;
  /** Optional content (ie an image), rendered at the end of the toast */
  content?: JSX.Element;
  /**
   * Makes toast persist on the screen until it is manually closed by the user.
   * @default false
   */
  persist?: boolean;
  /** Redirect link */
  redirectTo?: string;
  /** For two-lined toasts, the title is a bolded header above the body text */
  title?: string | JSX.Element;
  /**
   * Hides close button in top right corner
   * @default false
   * */
  hideCloseButton?: boolean;
  onClose?: () => void;
}

/**
 * Internal-only, for accessing the toast key within onClicks
 */
export interface ToastWithKeyProps extends ToastProps {
  toastKey: SnackbarKey;
  closeToast: () => void;
}
