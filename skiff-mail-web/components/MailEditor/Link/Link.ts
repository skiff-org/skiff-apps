import Link from '@tiptap/extension-link';
import { ThemeMode } from '@skiff-org/skiff-ui';

import { linkStyling } from '../nodeStyles';

declare module '@tiptap/extension-link' {
  interface LinkOptions {
    theme: ThemeMode;
  }
}

export default Link.extend({
  renderHTML({ mark }) {
    const { href, target } = mark.attrs;
    return ['a', { href, target, rel: 'noopener noreferrer nofollow', style: linkStyling }, 0];
  }
}).configure({ openOnClick: false });
