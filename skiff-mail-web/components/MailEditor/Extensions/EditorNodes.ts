import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

import { Blockquote } from '../Blockquote';
import { BulletList } from '../BulletList';
import { HardBreak } from '../HardBreak';
import { Image } from '../Image';
import { ListItem } from '../ListItem';
import { OrderedList } from '../OrderedList';

import { EditorExtensionsOptions } from './ExtensionsOptions';

export { BulletList, Document, Heading, ListItem, OrderedList, Paragraph, Text, Blockquote, Image };

export const buildEditorNodes = (options?: EditorExtensionsOptions) => [
  Document,
  Paragraph,
  Text,
  Heading,
  BulletList,
  ListItem,
  OrderedList,
  Image,
  HardBreak,
  Blockquote.configure({
    disableToggle: !!options?.disableBlockquoteToggle,
    threadSenders: options?.threadSenders
  })
];
