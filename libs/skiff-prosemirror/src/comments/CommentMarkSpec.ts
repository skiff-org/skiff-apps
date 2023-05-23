import cx from 'classnames';
import { MarkSpec } from 'prosemirror-model';

export const COMMENT_MARK_CLASS = 'comment-mark';
export const COMMENT_MARK_ACTIVATED_CLASS = 'activated-comment-mark';

const CommentMarkSpec: MarkSpec = {
  attrs: {
    comments: {
      default: null
    }
  },
  inclusive: false,
  excludes: '',
  parseDOM: [
    {
      tag: 'span.prosemirror-comment-list',
      getAttrs: () => false
    }
  ],

  toDOM(mark) {
    return [
      'span',
      {
        class: cx('prosemirror-comment-list', COMMENT_MARK_CLASS, mark.attrs.comments.resolved ? 'resolved' : ''),
        id: mark.attrs.comments.id
      }
    ];
  }
};
export default CommentMarkSpec;
