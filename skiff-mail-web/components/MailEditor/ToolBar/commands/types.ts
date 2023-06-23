import { IconProps } from '@skiff-org/skiff-ui';

export interface ToolBarCommand {
  icon: IconProps['icon'];
  command: (editor) => void;
  enabled: (editor) => boolean;
  active: (editor) => boolean;
  label: string;
  // For a dropdown group, the higher priority is shown in the button if the selection has some active
  // example
  // a bullet list is also a paragraph
  // the button will show bullet list
  priority?: number;
}

export enum ToolBarCommandGroupTypes {
  Dropdown,
  Normal
}

export interface ToolBarCommandGroup {
  commands: ToolBarCommand[];
  type: ToolBarCommandGroupTypes;
}
