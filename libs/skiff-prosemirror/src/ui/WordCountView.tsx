// eslint-disable-next-line max-classes-per-file
import { CellSelection } from '@skiff-org/prosemirror-tables';
import { EditorState } from 'prosemirror-state';
import React from 'react';
import { removeAllWhitespace } from 'skiff-utils';

import { InjectedPopUpProps } from './createPopUp';

export type WordCountViewProps = {
  editorState: EditorState;
  close: () => void;
};
type State = {
  editorState: EditorState;
};

class StatCard extends React.PureComponent<{
  label: string;
  value: number;
}> {
  render() {
    const { label, value } = this.props;
    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'row',
          borderBottom: '1px solid var(--border-secondary)',
          width: '254px',
          margin: '16px 0',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '6px'
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '16px',
            marginTop: '-10px',
            background: 'var(--bg-l0-solid)',
            padding: '4px 11px',
            color: 'var(--text-secondary)',
            borderRadius: '5px',
            position: 'absolute',
            right: '28px'
          }}
        >
          {/* format with commas */}
          {value.toLocaleString()}
        </div>
      </div>
    );
  }
} // Popup viewer for editor word count

class WordCountView extends React.PureComponent<WordCountViewProps & InjectedPopUpProps, State> {
  constructor(props: WordCountViewProps & InjectedPopUpProps, context: Record<string, any>) {
    super(props, context);
    const { editorState } = props;
    this.state = {
      editorState
    };
  }

  render() {
    const { editorState } = this.state;
    let wordCount = 0;

    const { selection } = editorState;

    let from: number;
    let to: number;

    if (selection instanceof CellSelection) {
      from = selection.$anchorCell.pos;
      to = selection.to;
    } else {
      from = selection.from;
      to = selection.to;
    }

    const textSelected = from !== to;
    let selectionWordCount = 0;

    if (textSelected) {
      editorState.doc.cut(from, to).descendants((node) => {
        if (
          node.isText &&
          // sometimes text node has invisible character that making the editor think there is content in node.
          // this regex is removing any character that is not in the reasonable characters range for user input (0-127 in the ASCII table).
          node.textContent.replace(/[\u200B]/g, '') !== ''
        ) {
          const nodeText = node.textContent;
          const trimmed = nodeText.trim();
          const tempWordCount = trimmed ? trimmed.split(/\s+/).length : 0;
          selectionWordCount += tempWordCount;
        }
      });
    }

    editorState.doc.descendants((node) => {
      if (node.isText && node.textContent.replace(/[\u200B]/g, '') !== '') {
        const nodeText = node.textContent;
        const trimmed = nodeText.trim();
        const tempWordCount = trimmed ? trimmed.split(/\s+/).length : 0;
        wordCount += tempWordCount;
      }
    });

    const { textContent } = editorState.doc;
    const charsWithWhitespace = textContent.length;
    const charsWithoutWhitespace = removeAllWhitespace(textContent).length;
    return (
      <div
        style={{
          width: 'fit-content',
          height: 'fit-content',
          right: '42%',
          top: '30%',
          position: 'fixed',
          background: 'var(--bg-l2-solid)',
          fontFamily: 'Skiff Sans Text, sans-serif',
          borderRadius: '16px',
          padding: '30px 28px 40px',
          display: 'inline-flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            fontWeight: 560,
            fontSize: '20px',
            marginBottom: '30px',
            color: 'var(--text-secondary)'
          }}
        >
          Word count
        </div>
        <StatCard label='Words' value={wordCount} />
        <StatCard label='Characters' value={charsWithWhitespace} />
        <StatCard label='Characters (no spaces)' value={charsWithoutWhitespace} />
        {textSelected && <StatCard label='Words In Selection' value={selectionWordCount} />}
      </div>
    );
  }
}

export default WordCountView;
