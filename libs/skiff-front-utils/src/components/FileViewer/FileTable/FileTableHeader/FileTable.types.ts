import { Icon } from '@skiff-org/skiff-ui';

export interface FileTableAction {
  icon: Icon;
  label?: string;
  onClick: () => void;
  key: string;
  tooltip?: string;
  dataTest?: string;
}
