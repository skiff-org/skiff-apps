import { themeNames } from '@skiff-org/skiff-ui';
import Link from '@tiptap/extension-link';
import { ThemeName } from '../../../context/ThemeContext';

declare module '@tiptap/extension-link' {
  interface LinkOptions {
    theme: ThemeName;
  }
}

const linkStyling = (theme: ThemeName) => `
    color: ${theme === 'light' ? themeNames.light['--text-link'] : themeNames.dark['--text-link']};
    background: var(--transparent-background);
    cursor: pointer;
    text-decoration: none;
`;

export default Link.extend({
  renderHTML({ mark }) {
    const { href, target } = mark.attrs;
    return ['a', { href, target, rel: 'noopener noreferrer nofollow', style: linkStyling(this.options.theme) }, 0];
  }
}).configure({ openOnClick: false });
