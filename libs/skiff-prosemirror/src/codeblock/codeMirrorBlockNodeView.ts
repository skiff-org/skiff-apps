import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment';
import { foldGutter, foldKeymap } from '@codemirror/fold';
import { highlightActiveLineGutter, lineNumbers } from '@codemirror/gutter';
import { defaultHighlightStyle } from '@codemirror/highlight';
import { indentOnInput } from '@codemirror/language';
import { bracketMatching } from '@codemirror/matchbrackets';
import { rectangularSelection } from '@codemirror/rectangular-selection';
import { highlightSelectionMatches, selectNextOccurrence } from '@codemirror/search';
import { Compartment, EditorState } from '@codemirror/state';
import { drawSelection, EditorView, highlightActiveLine, keymap } from '@codemirror/view';
import { exitCode } from 'prosemirror-commands';
import { Node } from 'prosemirror-model';
import { findChildrenByMark } from 'prosemirror-utils';
import { EditorView as PMEditorView, NodeView } from 'prosemirror-view';
import { isMobile } from 'react-device-detect';

import { commentPluginKey } from '../comments/comment.types';
import { COMMENT_MARK_ACTIVATED_CLASS } from '../comments/CommentMarkSpec';
import { MARK_COMMENT } from '../MarkNames';

import {
  activateCommentRange,
  clearMarksAtRangeByClass,
  CodeMirrorCommentAttributes,
  markComments
} from './codeBlockComment';
import { CodeBlockSettings } from './types';
import {
  backspaceHandler,
  computeChange,
  forwardSelection,
  getMarkFromNode,
  handleCodemirrorClick,
  maybeEscape,
  resetCodemirrorSelection,
  setMode,
  valueChanged
} from './utils';

declare global {
  interface Window {
    lastActiveCodemirrorView: EditorView;
  }
}

export const codeMirrorBlockNodeView: (
  settings: CodeBlockSettings
) => (pmNode: Node, view: PMEditorView, getPos: (() => number) | boolean) => NodeView =
  (settings) => (pmNode, view, getPos) => {
    let node = pmNode;
    let updating = false;
    const dom = document.createElement('div');
    dom.className = 'codeblock-root';
    const languageConf = new Compartment();
    const state = EditorState.create({
      extensions: [
        EditorState.readOnly.of(settings.readOnly),
        EditorView.editable.of(!settings.readOnly),
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        autocompletion(),
        rectangularSelection(),
        drawSelection({ cursorBlinkRate: 1000 }),
        EditorState.allowMultipleSelections.of(true),
        highlightActiveLine(),
        defaultHighlightStyle.fallback,
        languageConf.of([]),
        indentOnInput(),
        EditorView.domEventHandlers({
          focus(_event, cmView) {
            // Reset selection of prev codemirror view
            if (window.lastActiveCodemirrorView) {
              resetCodemirrorSelection(window.lastActiveCodemirrorView);
            }
            // Update codemirror view on window
            window.lastActiveCodemirrorView = cmView;
          },
          click(event, cmView) {
            // On mobile it takes time for codemirror to update selection,
            // So we handle the event only after a timeout
            if (isMobile) {
              setTimeout(() => {
                handleCodemirrorClick(event, view, cmView, node, getPos);
              }, 0);
            }
            if (!isMobile) return handleCodemirrorClick(event, view, cmView, node, getPos);
          }
        }),
        keymap.of([
          { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true },
          {
            key: 'ArrowUp',
            run: (cmView) => maybeEscape('line', -1, cmView, view, getPos)
          },
          {
            key: 'ArrowLeft',
            run: (cmView) => maybeEscape('char', -1, cmView, view, getPos)
          },
          {
            key: 'ArrowDown',
            run: (cmView) => maybeEscape('line', 1, cmView, view, getPos)
          },
          {
            key: 'ArrowRight',
            run: (cmView) => maybeEscape('char', 1, cmView, view, getPos)
          },
          {
            key: 'Mod-z',
            run: () => settings.undo?.(view.state, view.dispatch) || true,
            shift: () => settings.redo?.(view.state, view.dispatch) || true
          },
          {
            key: 'Mod-y',
            run: () => settings.redo?.(view.state, view.dispatch) || true
          },
          { key: 'Backspace', run: (cmView) => backspaceHandler(view, cmView) },
          {
            key: 'Mod-Backspace',
            run: (cmView) => backspaceHandler(view, cmView)
          },
          // {
          //   key: 'Mod-a',
          //   run: () => {
          //     const result = selectAll(view.state, view.dispatch);
          //     view.focus();
          //     return result;
          //   }
          // },
          {
            key: 'Enter',
            run: (cmView) => {
              const sel = cmView.state.selection.main;
              if (
                cmView.state.doc.line(cmView.state.doc.lines).text === '' &&
                sel.from === sel.to &&
                sel.from === cmView.state.doc.length
              ) {
                exitCode(view.state, view.dispatch);
                view.focus();
                return true;
              }
              return false;
            }
          },
          ...defaultKeymap,
          ...foldKeymap,
          ...closeBracketsKeymap,
          ...completionKeymap,
          ...commentKeymap,
          indentWithTab
        ]),
        ...(settings.theme ? settings.theme : [])
      ],
      doc: node.textContent
    });

    const codeMirrorView = new EditorView({
      state,
      dispatch: (tr) => {
        codeMirrorView.update([tr]);
        if (!updating) {
          const textUpdate = tr.state.toJSON().doc;
          valueChanged(textUpdate, node, getPos, view);
          forwardSelection(codeMirrorView, view, getPos);
        }
      }
    });

    const updateMarks = (node: Node<any>) => {
      // Get all nodes in codeblock with marks
      const commentNodes = findChildrenByMark(node, view.state.schema.marks.comment);
      const commentAttributes = commentNodes.reduce<CodeMirrorCommentAttributes[]>((marks, commentNode) => {
        const commentMark = getMarkFromNode(commentNode.node, MARK_COMMENT);
        if (commentMark) {
          marks.push({
            from: commentNode.pos,
            to: commentNode.pos + commentNode.node.nodeSize,
            id: commentMark.attrs.comments.id,
            resolved: commentMark.attrs.comments.resolved
          });
        }
        return marks;
      }, []);
      // Add code mirror marks to codemirror doc
      markComments(codeMirrorView, commentAttributes);
      // Find active thread
      const activeThread = commentPluginKey.getState(view.state)?.activeThread;
      const relativePos = typeof getPos === 'function' ? getPos() : 0;
      if (activeThread) {
        // add codemirror active thread mark to the codemirror node
        activateCommentRange(
          codeMirrorView,
          activeThread?.from - relativePos - 1,
          activeThread?.to - relativePos,
          activeThread?.id[0]
        );
      } else {
        // If there is no active thread clear all active comment marks
        clearMarksAtRangeByClass(codeMirrorView, [COMMENT_MARK_ACTIVATED_CLASS]);
      }
    };

    updateMarks(node); // On init update marks

    dom.append(codeMirrorView.dom);

    const selectDeleteCB = settings.createSelect(settings, dom, node, view, getPos);
    setMode(node.attrs.lang, codeMirrorView, settings, languageConf);

    return {
      dom,
      selectNode() {
        codeMirrorView.focus();
      },
      stopEvent: (e: Event) => settings.stopEvent(e, node, getPos, view, dom),
      setSelection: (anchor, head) => {
        codeMirrorView.focus();
        forwardSelection(codeMirrorView, view, getPos);
        updating = true;
        codeMirrorView.dispatch({
          selection: { anchor: anchor, head: head }
        });
        updating = false;
      },
      update: (updateNode) => {
        if (updateNode.type.name !== node.type.name) return false;
        if (updateNode.attrs.lang !== node.attrs.lang)
          setMode(updateNode.attrs.lang, codeMirrorView, settings, languageConf);
        const oldNode = node;
        node = updateNode;
        const change = computeChange(codeMirrorView.state.doc.toString(), node.textContent);
        if (change) {
          updating = true;
          codeMirrorView.dispatch({
            changes: {
              from: change.from,
              to: change.to,
              insert: change.text
            },
            selection: { anchor: change.from + change.text.length }
          });
          updating = false;
        }
        if (node.hasMarkup(updateNode.type, updateNode.attrs, updateNode.marks)) {
          updateMarks(updateNode);
        }
        settings.updateSelect(settings, dom, updateNode, view, getPos, oldNode);

        return true;
      },
      ignoreMutation: () => true,
      destroy: () => {
        selectDeleteCB();
      }
    };
  };
