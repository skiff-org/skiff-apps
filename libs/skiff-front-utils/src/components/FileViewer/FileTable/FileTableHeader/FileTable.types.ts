import { Icon } from 'nightwatch-ui';
import { MouseEvent, RefObject } from 'react';

export interface ActionIcon {
  icon: Icon;
  label?: string;
  onClick: (e?: MouseEvent) => void;
  key: string;
  tooltip: string | JSX.Element;
  dataTest?: string;
  ref?: RefObject<HTMLDivElement>;
}
