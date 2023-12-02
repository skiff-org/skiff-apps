import { ThemeMode } from '../../types';

export enum CodeInputType {
  NUMBER = 'number',
  TEXT = 'text'
}

export type CodeInputProps = {
  /** Expected length of code */
  codeLength: number;
  /** Controlled code value */
  value: string;
  /** onChange event; fires when code changes */
  onChange: (inputToken: string) => void;
  /** Submit code */
  onSubmit: () => Promise<void> | void;
  /** For styled components */
  className?: string;
  /** Indicator for e2e tests */
  dataTest?: string;
  /** Error state / message */
  error?: boolean | string;
  /** Forced theme mode */
  forceTheme?: ThemeMode;
  /** Controlled loading value */
  isSubmitting?: boolean;
  /** For customization */
  style?: React.CSSProperties;
  /**
   * Accepted input type
   * Can either be text or number
   */
  type?: CodeInputType;
};
