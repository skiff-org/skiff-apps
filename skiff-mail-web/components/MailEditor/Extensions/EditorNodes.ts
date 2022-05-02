import Document from '@tiptap/extension-document';
import BulletList from '@tiptap/extension-bullet-list';
import Heading from '@tiptap/extension-heading';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

import { Blockquote } from '../Blockquote';
import { Image } from '../Image';
import { ListItem } from '../ListItem';
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
  Blockquote.configure({
    disableToggle: !!options?.disableBlockquoteToggle,
    threadSenders: options?.threadSenders
  })
];
