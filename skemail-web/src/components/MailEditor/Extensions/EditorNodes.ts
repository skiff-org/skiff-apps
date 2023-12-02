import { Blockquote as BlockquoteEditor } from '@tiptap/extension-blockquote';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Paragraph from '@tiptap/extension-paragraph';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';

import { Blockquote } from '../Blockquote';
import { BulletList } from '../BulletList';
import { HardBreak } from '../HardBreak';
import { Image } from '../Image';
import { ListItem } from '../ListItem';
import { OrderedList } from '../OrderedList';

import { EditorExtensionsOptions } from './ExtensionsOptions';

export { HorizontalRule, BulletList, Document, Heading, ListItem, OrderedList, Paragraph, Text, Blockquote, Image };

export const buildEditorNodes = (options?: EditorExtensionsOptions) => [
  HorizontalRule,
  Document,
  BlockquoteEditor,
  Paragraph.configure({
    HTMLAttributes: {
      dir: 'auto',
      style: 'padding: 0px; margin: 0px; min-height: 1em;'
    }
  }),
  Text,
  Heading.configure({
    HTMLAttributes: {
      dir: 'auto',
      style: 'padding: 0px; margin: 0px; min-height: 1em; font-weight: 470;'
    }
  }),
  BulletList,
  ListItem.configure({
    HTMLAttributes: {
      class: 'editor-list-item'
    }
  }),
  OrderedList,
  HorizontalRule.configure({
    HTMLAttributes: {
      style: 'border: none; border-top: 1px solid var(--border-primary); margin: 0px; padding: 0px;'
    }
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph']
  }),
  Table,
  TableRow,
  TableCell,
  TableHeader,
  Image,
  HardBreak,
  Blockquote.configure({
    disableToggle: !!options?.disableBlockquoteToggle,
    threadSenders: options?.threadSenders
  })
];
