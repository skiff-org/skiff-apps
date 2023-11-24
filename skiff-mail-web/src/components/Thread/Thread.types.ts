import { Icon } from 'nightwatch-ui';
export interface ThreadNavigationIDs {
  threadID: string;
  emailID?: string;
}

export interface ThreadBlockOptions {
  label: string;
  icon?: Icon;
  onClick?: (e?: any) => void;
  subOptions?: ThreadBlockOptions[];
  customComponent?: React.ReactElement;
  /** True if the option only applies to one email, not an entire thread. */
  emailSpecific?: boolean;
  /** True if the option is rendered as an action button in mobile */
  isMobileActionButton?: boolean;
}

export enum OptionWithSubOption {
  Report = 'Report'
}
