import { ThemeMode, Icon } from 'nightwatch-ui';

export interface DrawerProps {
  show: boolean;
  hideDrawer: () => void;
  children: React.ReactNode;
  title?: string;
  scrollable?: boolean;
  titleIcon?: Icon;
  extraSpacer?: boolean;
  paperId?: string;
  scrollBoxId?: string;
  showClose?: boolean;
  selectable?: boolean;
  verticalScroll?: boolean;
  forceTheme?: ThemeMode;
  formatTitle?: boolean;
  maxHeight?: number | string;
  borderRadius?: number | string;
  wrapTitle?: boolean;
  stickHandleOnTop?: boolean;
  keyboardHeight?: number;
}
