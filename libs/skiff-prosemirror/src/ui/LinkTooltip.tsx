import './skiff-link-tooltip.css';

import { FilledVariant, Icon, IconButton, ThemeMode, Type } from 'nightwatch-ui';
import { EditorView } from 'prosemirror-view';
import React from 'react';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

import sanitizeURL from '../sanitizeURL';

import CustomButton from './CustomButton';

function isBookMarkHref(href: string): boolean {
  return !!href && href.indexOf('#') === 0 && href.length >= 2;
}

class LinkTooltip extends React.PureComponent<
  {
    close: () => void;
    editorView: EditorView;
    href: string;
    onCancel: (view: EditorView) => void;
    onEdit: (view: EditorView) => void;
    onRemove: (view: EditorView) => void;
  },
  { hidden: boolean }
> {
  state = {
    hidden: false
  };

  _openLink = (href: string): void => {
    if (isBookMarkHref(href)) {
      const id = href.substr(1);
      const el = document.getElementById(id);

      if (el) {
        const { onCancel, editorView } = this.props;
        onCancel(editorView);

        void (async () => {
          // https://www.npmjs.com/package/smooth-scroll-into-view-if-needed
          await scrollIntoView(el, {
            scrollMode: 'if-needed',
            // block: 'nearest',
            // inline: 'nearest',
            behavior: 'smooth'
          });
        })();
      }

      return;
    }

    if (href) {
      window.open(sanitizeURL(href));
    }
  };

  render() {
    const { href, editorView, onEdit, onRemove } = this.props;
    const useBookMark = isBookMarkHref(href);
    const editButton = !!useBookMark && <CustomButton label='Change' onClick={onEdit} value={editorView} />;
    return (
      <div className='skiff-link-tooltip'>
        <div className='skiff-link-tooltip-body'>
          <div className='skiff-link-tooltip-row'>
            <CustomButton
              className={useBookMark ? null : 'skiff-link-tooltip-href'}
              label={useBookMark ? 'Jump To Bookmark' : href}
              onClick={this._openLink}
              target='new'
              title={useBookMark ? null : href}
              value={href}
            />
            {editButton}
            <IconButton
              type={Type.SECONDARY}
              icon={Icon.Unlink}
              onClick={() => onRemove(editorView)}
              tooltip='Unlink'
              forceTheme={ThemeMode.DARK}
              variant={FilledVariant.UNFILLED}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default LinkTooltip;
