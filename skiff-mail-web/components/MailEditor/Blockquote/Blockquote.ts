import Blockquote from '@tiptap/extension-blockquote';
import { ReactNodeViewRenderer } from '@tiptap/react';

import BlockquoteNodeView from './BlockquoteNodeView';
import { getBlockquoteDepth } from './utils';

export const attributesHtmlNames = {
  isMail: 'data-skiff-mail',
  sender: 'data-skiff-sender'
};

declare module '@tiptap/extension-blockquote' {
  interface BlockquoteOptions {
    disableToggle: boolean;
    threadSenders: string[];
  }
}

export default Blockquote.extend({
  name: 'blockquote',
  addNodeView() {
    return ReactNodeViewRenderer(BlockquoteNodeView);
  },
  addOptions() {
    return {
      ...this.parent?.(),
      /**
       * if true disables the toggling option of the mail quotes,
       * they are always open when true
       */
      disableToggle: false
    };
  },
  parseHTML() {
    return [
      // Outlook parsing rule
      { tag: 'div[id="3D\\"divRplyFwdMsg\\""]' },
      // yahoo parsing rule
      { tag: 'div.yahoo_quoted' },
      // gmail parsing rule
      { tag: 'div.gmail_quote' },
      // skemail parsing rule
      { tag: 'blockquote' }
    ];
  },
  addAttributes() {
    return {
      /**
       * The thread sender for the left color
       */
      sender: {
        parseHTML: (element) => {
          // If sender is already an attribute, return
          const senderFromElement = element.getAttribute(attributesHtmlNames.sender);
          if (senderFromElement) {
            return senderFromElement;
          }
          // Else get sender from threadSenders
          const depth = getBlockquoteDepth(element);
          const { threadSenders } = this.options;
          if (threadSenders && threadSenders.length > depth) {
            return threadSenders[depth];
          }
          return '';
        },
        renderHTML: (attributes) => ({
          class: 'skiff_quote',
          [attributesHtmlNames.sender]: attributes.sender
        })
      },
      /**
       * is this node a quote of an email
       */
      isMail: {
        default: false,
        parseHTML: (element) => {
          let isMailQuote = false;

          // Skiff mail quote
          if (element.getAttribute(attributesHtmlNames.isMail)) isMailQuote = true;

          // One type of Gmail mail quote
          if (element.getAttribute('class') === '3D"gmail_quote"') isMailQuote = true;

          // Another type of Gmail mail quote
          if (element.getAttribute('class') === 'gmail_quote') isMailQuote = true;

          // Proton mail quote
          if (element.getAttribute('class') === 'protonmail_quote') isMailQuote = true;

          // Tutanota mail quote
          if (element.getAttribute('class') === 'tutanota_quote') isMailQuote = true;

          // Yahoo mail quote
          if (element.getAttribute('class') === 'yahoo_quoted') isMailQuote = true;

          // Outlook mail quote
          if (element.getAttribute('id') === '3D"divRplyFwdMsg"') isMailQuote = true;

          return isMailQuote;
        },
        renderHTML: (attributes) => ({
          class: 'skiff_quote',
          [attributesHtmlNames.isMail]: attributes.isMail
        })
      },
      /**
       * should this quote be open or collapsed
       * affects only mail quotes
       */
      isOpen: {
        default: false
      }
    };
  }
});
