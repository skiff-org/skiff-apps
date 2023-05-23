import 'prosemirror-gapcursor/style/gapcursor.css';
import 'prosemirror-view/style/prosemirror.css';
import './skiff-editor.css';
import '../samsungFix';

import { mathSerializer } from '@benrbray/prosemirror-math';
import cx from 'classnames';
import { Node as ProsemirrorNode, Slice } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { Decoration, EditorView, NodeView } from 'prosemirror-view';
import React from 'react';
import { BrowserView, MobileView } from 'react-device-detect';

import { focusEditorSelection, getCustomState, syncPluginKey } from '..';
import { commentPluginKey, CommentPluginState } from '../comments/comment.types';
import { CommentsSidepanel } from '../comments/components/CommentsSidepanel';
import { FloatingComments } from '../comments/components/FloatingThreads';
import { MobileThreadPopup } from '../comments/components/MobileThreadPopup';
import { ThreadPopup } from '../comments/components/ThreadPopup';
import { getVisibleComments } from '../comments/utils/FloatingThreads';
import { getScreenSize, ScreenSizes } from '../comments/utils/ScreenSizes';
//import { checkYjsSynced, exportJSON, registerEditorView, registeryKeys, releaseEditorView } from '../CZIProseMirror';
import EditorSchema from '../EditorSchema';
import EditorMentionsMenu from '../mentionsMenu/EditorMentionsMenu';
import { MentionMenuState, mentionsKey } from '../mentionsMenu/utils';
import { BOOKMARK, LIST_ITEM, LIST_TASK_ITEM, TOGGLE_LIST_ITEM } from '../NodeNames';
import normalizeHTML from '../normalizeHTML';
import handlePaste from '../pasteHandlers/handlePaste';
import {
  checkYjsSynced,
  exportJSON,
  getViewAndClasses,
  registerEditorView,
  registeryKeys,
  releaseEditorView
} from '../SkiffProseMirror';
import EditorSlashMenu from '../slashMenu/EditorSlashMenu';
import { slashMenuKey, SlashMenuState } from '../slashMenu/InterfacesAndEnums';
import ToggleItemNodeView from '../toggleList/ToggleItemNodeView';
import { ScrollSelctors } from '../utils/scrollController';

import BookmarkNodeView from './BookmarkNodeView';
import CustomEditorView from './CustomEditorView';
import CustomNodeView from './CustomNodeView';
import EditorFrameset from './EditorFrameset';
import { handleDeepLink } from './handleDeepLink';
import handleEditorKeyDown from './handleEditorKeyDown';
import ListItemNodeView from './ListItemNodeView';
import { editorSpellcheck } from './spellcheck';
import TaskItemNodeView from './TaskItemNodeView';
import uuid from './uuid';

declare global {
  interface Window {
    activeDocEditor?: EditorView;
  }
}

export type EditorProps = {
  autoFocus?: boolean;
  disabled?: boolean | null;
  dispatchTransaction?: (tr: Transaction) => void;
  editorState: EditorState;
  embedded?: boolean | null;
  onReady?: ((view: EditorView) => void) | null;
  overlay?: boolean | React.ReactElement<any> | null;
  placeholder?: (string | React.ReactElement<any>) | null;
  isMobile: boolean;
  initialNodeViews: {
    [name: string]: (
      node: ProsemirrorNode<any>,
      view: EditorView<any>,
      getPos: boolean | (() => number),
      decorations: Decoration<{
        [key: string]: any;
      }>[]
    ) => NodeView<any>;
  };
  commentsSidepanelOpen?: boolean;
  header?: React.ReactElement<any> | null;
  width?: (string | number) | null;
  height?: (string | number) | null;
  snapshotPanelOpen: boolean;
  currentID?: string;
};

type EditorComponentState = {
  isPrinting: boolean;
  slashMenuPluginState?: SlashMenuState;
  mentionMenuPluginState?: MentionMenuState;
  commentPluginState?: CommentPluginState;
  screenSize: ScreenSizes;
  sidepanelTimeout: boolean;
};

// Export utilities for debugging.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.SkiffProseMirror = {
  exportJSON,
  registeryKeys,
  checkYjsSynced,
  getViewAndClasses
};
// Default custom node views.
export const DEFAULT_NODE_VIEWS = Object.freeze({
  [BOOKMARK]: BookmarkNodeView,
  [LIST_ITEM]: ListItemNodeView,
  [LIST_TASK_ITEM]: TaskItemNodeView,
  [TOGGLE_LIST_ITEM]: ToggleItemNodeView
});

const handleDOMEvents = {
  keydown: handleEditorKeyDown
};

function bindNodeView(NodeView: CustomNodeView): (...args: Array<any>) => any {
  // TODO: Get rid of CustomNodeViews!!
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (node, view, getPos, decorations) => new NodeView(node, view, getPos, decorations);
}

class Editor extends React.PureComponent<EditorProps, EditorComponentState> {
  _id = uuid();

  _editorView: EditorView | null = null;

  _metaActionsQueue: { key: string; value: any }[];

  constructor(props: EditorProps) {
    super(props);
    this.state = {
      isPrinting: false,
      screenSize: getScreenSize(),
      sidepanelTimeout: false
    };
    this._metaActionsQueue = [];
  }

  componentDidMount(): void {
    const { autoFocus, onReady, editorState, placeholder, disabled, initialNodeViews } = this.props;
    const editorNode = document.getElementById(this._id);

    if (editorNode) {
      const boundNodeViews = { ...initialNodeViews };
      const { nodes } = EditorSchema;
      Object.keys(DEFAULT_NODE_VIEWS).forEach((nodeName) => {
        const nodeView = DEFAULT_NODE_VIEWS[nodeName];

        // Only valid and supported node views should be used.
        if (nodes[nodeName]) {
          boundNodeViews[nodeName] = bindNodeView(nodeView);
        }
      });
      // Reference: http://prosemirror.net/examples/basic/

      this._editorView = new CustomEditorView(editorNode, {
        ...this.props,
        attributes: { spellcheck: editorSpellcheck },
        editable: this._isEditable,
        nodeViews: boundNodeViews,
        state: editorState,
        handleDOMEvents,
        handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => {
          if (!(view instanceof CustomEditorView)) throw new Error('view not CustomEditorView');
          return handlePaste(view, event, slice);
        },
        transformPastedHTML: normalizeHTML,
        clipboardTextSerializer: (slice) => mathSerializer.serializeSlice(slice),
        scrollThreshold: { top: 0, bottom: 65, left: 0, right: 0 },
        scrollMargin: { top: 0, bottom: 65, left: 0, right: 0 }
      });

      // Global way to access editor
      // Currently used for setting scrollThreshold and margin on mobile
      window.activeDocEditor = this._editorView;

      if (this._editorView instanceof CustomEditorView) {
        this._editorView.placeholder = placeholder;
        this._editorView.readOnly = false;
        this._editorView.disabled = !!disabled;
      }

      this._editorView.updateState(editorState);
      // Expose the view to SkiffProseMirror so developer could debug it.
      registerEditorView(this._id, this._editorView);
      onReady?.(this._editorView);

      // on mount, focus title
      if (autoFocus) {
        setTimeout(() => {
          this.focus();
          this._metaActionsQueue.push({ key: focusEditorSelection, value: true });
        });
      }

      // perform initial sidepane resize
      setTimeout(() => {
        if (!this._editorView) return;

        const { deeplink } = getCustomState(editorState);
        if (deeplink) handleDeepLink(this._editorView, deeplink);
      }, 0);
    }
    const editorBody = document.querySelector(ScrollSelctors.EditorBody);
    editorBody?.addEventListener('scroll', this._onScroll, false);
    window.addEventListener('beforeprint', this._onPrintStart, false);
    window.addEventListener('afterprint', this._onPrintEnd, false);
    window.addEventListener('resize', this._onScreenResize, false);
  }

  componentDidUpdate(prevProps: EditorProps): void {
    const view = this._editorView;

    if (this.props.currentID !== prevProps.currentID) {
      // if ID changed, focus on title
      setTimeout(() => {
        this.focus();
        this._metaActionsQueue.push({ key: focusEditorSelection, value: true });
      });
    }

    if (view && view instanceof CustomEditorView) {
      const { editorState, placeholder, disabled } = this.props;
      const { isPrinting } = this.state;
      const state = editorState;
      view.placeholder = placeholder;
      view.readOnly = isPrinting;
      view.disabled = !!disabled;
      view.updateState(state);
    }

    if (view && syncPluginKey.getState(view?.state)?.synced) {
      // if the doc is synced, we fire transactions from the queue
      // this meant to "communicate" with the editor plugins
      const { tr } = view.state;
      while (this._metaActionsQueue.length > 0) {
        const next = this._metaActionsQueue.pop();
        if (next) {
          const { key, value } = next;
          tr.setMeta(key, value);
          view.dispatch(tr);
        }
      }
    }
  }

  componentWillUnmount(): void {
    this._editorView?.destroy();
    this._editorView = null;
    window.activeDocEditor = undefined;
    releaseEditorView(this._id);
    const editorBody = document.querySelector(ScrollSelctors.EditorBody);
    editorBody?.removeEventListener('scroll', this._onScroll, false);
    window.removeEventListener('beforeprint', this._onPrintStart, false);
    window.removeEventListener('afterprint', this._onPrintEnd, false);
    window.removeEventListener('resize', this._onScreenResize, false);
  }

  static getDerivedStateFromProps(props: { editorState: EditorState }, state: Readonly<EditorComponentState>) {
    const slashMenuPluginState = slashMenuKey.getState(props.editorState);
    const mentionMenuPluginState = mentionsKey.getState(props.editorState);
    const commentPluginState = commentPluginKey.getState(props.editorState);
    return {
      ...state,
      slashMenuPluginState,
      mentionMenuPluginState,
      commentPluginState
    };
  }

  focus = (): void => {
    const view = this._editorView;
    if (view && view instanceof CustomEditorView && !view.disabled) {
      view.focus();
    }
  };

  _isEditable = (): boolean => {
    const { disabled } = this.props;
    const { isPrinting } = this.state;
    return !isPrinting && !!this._editorView && !disabled;
  };

  _onPrintStart = (): void => {
    this.setState({
      isPrinting: true
    });
  };

  _onScroll = (): void => {};

  _onPrintEnd = (): void => {
    this.setState({
      isPrinting: false
    });
  };

  _onScreenResize = (): void => {
    this.setState({
      screenSize: getScreenSize()
    });
  };

  render() {
    const { header, height, width, embedded, overlay, commentsSidepanelOpen, editorState } = this.props;
    const { isPublicDocument } = getCustomState(editorState);

    const { slashMenuPluginState, mentionMenuPluginState, commentPluginState, screenSize } = this.state;
    const visibleComments = getVisibleComments(commentPluginState?.comments);

    if (!commentsSidepanelOpen)
      setTimeout(() => {
        this.setState((s) => ({ ...s, sidepanelTimeout: false }));
      }, 200);
    else this.setState((s) => ({ ...s, sidepanelTimeout: true }));

    const className = cx(
      'prosemirror-editor-wrapper',
      (visibleComments.length || commentsSidepanelOpen) &&
        screenSize === ScreenSizes.Large &&
        !isPublicDocument &&
        !this.props.isMobile
        ? 'push-editor-left'
        : undefined,
      {
        embedded,
        mobile: this.props.isMobile,
        readOnly: false
      }
    );

    const shouldThreadPopup = commentPluginState?.activeThread // User is viewing thread
      ? !commentsSidepanelOpen // If there is an active thread and the sidepanel is closed
      : commentPluginState?.open; // If there is no active thread, but the state is open (composing a new comment)

    const threadPopup = this._editorView && commentPluginState && shouldThreadPopup && (
      <>
        <BrowserView>
          <ThreadPopup
            state={commentPluginState}
            view={this._editorView}
            comentEditorNodeViews={this.props.initialNodeViews}
          />
        </BrowserView>
        <MobileView>
          <MobileThreadPopup
            state={commentPluginState}
            view={this._editorView}
            comentEditorNodeViews={this.props.initialNodeViews}
          />
        </MobileView>
      </>
    );

    return (
      <EditorFrameset
        body={
          <div
            className={`${className} ${
              commentPluginState?.showResolved ? 'show-resolved-comments' : ''
            } mobile-avoiding-keyboard`}
            data-skiff-prosemirror-editor-id={this._id}
            id={this._id}
          >
            {this._editorView && (
              <>
                {commentPluginState?.comments.length && !commentsSidepanelOpen ? (
                  <FloatingComments
                    state={commentPluginState}
                    view={this._editorView}
                    comentEditorNodeViews={this.props.initialNodeViews}
                  />
                ) : null}
                {threadPopup}
                {slashMenuPluginState?.open && (
                  <EditorSlashMenu slashMenuState={slashMenuPluginState} view={this._editorView} />
                )}
                {mentionMenuPluginState?.open && (
                  <EditorMentionsMenu
                    mentionMenuState={mentionMenuPluginState}
                    view={this._editorView}
                    customState={getCustomState(this._editorView.state)}
                  />
                )}
              </>
            )}
            {overlay && <div className='skiff-overlay'>{overlay}</div>}
          </div>
        }
        className={className}
        embedded={embedded}
        header={header}
        height={height}
        width={width}
        sidePanel={
          this._editorView && (this.state.sidepanelTimeout || commentsSidepanelOpen) ? (
            <CommentsSidepanel
              state={commentPluginState}
              view={this._editorView}
              close={!commentsSidepanelOpen}
              comentEditorNodeViews={this.props.initialNodeViews}
            />
          ) : null
        }
      />
    );
  }
}

export default Editor;
