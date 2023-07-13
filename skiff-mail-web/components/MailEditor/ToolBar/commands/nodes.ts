import { Icon } from '@skiff-org/skiff-ui';

import { Heading, Paragraph } from '../../Extensions/EditorNodes';

import { ToolBarCommand, ToolBarCommandGroup, ToolBarCommandGroupTypes } from './types';
import { alwaysTrue } from './utils';

const nodesCommandsLabels = {
  paragraph: 'Body'
};

export const paragraph: ToolBarCommand = {
  icon: Icon.Text,
  command: (editor) => {
    editor.chain().focus().setParagraph().run();
  },
  enabled: alwaysTrue,
  label: nodesCommandsLabels.paragraph,
  active: (editor) => editor && editor.isActive(Paragraph.name),
  priority: 1
};

export const headings: ToolBarCommand[] = [1, 2, 3, 4].map((level) => ({
  icon: `h${level}` as Icon,
  command: (editor) => {
    editor.chain().focus().setHeading({ level }).run();
  },
  enabled: (editor) => editor && editor.can().setHeading({ level }),
  label: `Heading ${level}`,
  active: (editor) => editor && editor.isActive(Heading.name, { level }),
  priority: 2
}));

export const allNodeCommandsGroup: ToolBarCommandGroup = {
  commands: [paragraph, ...headings],
  type: ToolBarCommandGroupTypes.Dropdown
};
