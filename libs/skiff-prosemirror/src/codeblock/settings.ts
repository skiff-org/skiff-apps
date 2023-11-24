import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { ThemeMode } from 'nightwatch-ui';
import { redo, undo } from 'y-prosemirror';

import { customCreateSelect, updateCustomSelect } from './customCreateSelect';

import {
  CodeBlockLanguages,
  CodeBlockSettings,
  defaultSettings as blockSettings,
  languageLoaders,
  legacyLanguageLoaders,
  LegacyLanguages
} from '.';

const skiffTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--text-primary)',
      background: 'var(--bg-overlay-tertiary)',
      boxShadow: 'var(--inset-empty)',
      borderRadius: '4px'
    },
    '.cm-content': {
      caretColor: 'var(--cta-primary-default)',
      borderLeft: '2px solid var(--text-secondary)',
      minHeight: '45px'
    },
    '&.cm-editor.cm-focused': {
      outline: 'none'
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--cta-primary-default)'
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      background: 'var(--accent-blue-secondary)'
    },
    '& .cm-selectionBackground, ::selection': {
      background: 'var(--accent-blue-secondary)'
    },
    '.cm-activeLine': { background: 'var(--bg-l2-solid)' },
    '.cm-activeLineGutter': { background: 'var(--bg-l2-solid)' },
    '.cm-gutters': {
      marginTop: '32px',
      paddingRight: '16px',
      background: 'var(--bg-code-gutter)',
      color: 'var(--text-tertiary)',
      border: 'none'
    },
    '.cm-line': {
      color: 'var(--text-secondary)'
    },
    '.ͼa': {
      color: 'var(--accent-dark-blue-primary)'
    },
    '.ͼb': {
      color: 'var(--accent-dark-blue-primary)'
    },
    '.ͼc': {
      color: 'var(--accent-green-primary)'
    },
    '.ͼd': {
      color: 'var(--accent-red-primary)'
    },
    '.ͼh': {
      color: 'var(--accent-green-primary)'
    },
    '.ͼf': {
      color: 'var(--accent-blue-primary)'
    },
    '.ͼi': {
      color: 'var(--accent-pink-primary)'
    },
    '.ͼk': {
      color: 'var(--accent-blue-primary)'
    },
    '.ͼn': {
      color: 'var(--accent-pink-primary)'
    },
    '.ͼ13': {
      color: 'var(--accent-green-primary)'
    },
    '.ͼt': {
      color: 'var(--text-secondary)'
    }
  },
  { dark: true }
);

const codeblockSettings = (theme: ThemeMode, readOnly: boolean): CodeBlockSettings => ({
  ...blockSettings,
  createSelect: customCreateSelect,
  updateSelect: updateCustomSelect,
  readOnly: readOnly,
  undo,
  redo,
  theme: [skiffTheme, ...(theme === ThemeMode.DARK ? [oneDarkHighlightStyle] : [])], //|| theme === "light"? lightTheme: darkTheme,
  languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
  languageWhitelist: [
    CodeBlockLanguages.css,
    LegacyLanguages.dockerfile,
    LegacyLanguages.erlang,
    LegacyLanguages.fortran,
    LegacyLanguages.go,
    LegacyLanguages.haskell,
    CodeBlockLanguages.javascript,
    LegacyLanguages.julia,
    LegacyLanguages.stex,
    LegacyLanguages.commonlisp,
    LegacyLanguages.lua,
    CodeBlockLanguages.markdown,
    LegacyLanguages.cmake,
    LegacyLanguages.octave, // instead of matlab
    LegacyLanguages.pascal,
    LegacyLanguages.perl,
    CodeBlockLanguages.php,
    LegacyLanguages.powershell,
    CodeBlockLanguages.python,
    LegacyLanguages.shell,
    LegacyLanguages.mathematica,
    LegacyLanguages.protobuf,
    LegacyLanguages.r,
    LegacyLanguages.ruby,
    CodeBlockLanguages.rust,
    LegacyLanguages.scheme,
    CodeBlockLanguages.sql,
    LegacyLanguages.swift,
    LegacyLanguages.verilog,
    LegacyLanguages.vhdl,
    CodeBlockLanguages.wast,
    CodeBlockLanguages.xml,
    LegacyLanguages.yaml,
    CodeBlockLanguages.cpp,
    CodeBlockLanguages.json,
    CodeBlockLanguages.java,
    CodeBlockLanguages.lezer,
    LegacyLanguages.solidity,
    LegacyLanguages.csharp,
    LegacyLanguages.objectiveC,
    LegacyLanguages.kotlin,
    CodeBlockLanguages.typescript,
    CodeBlockLanguages.tsx,
    CodeBlockLanguages.jsx
  ],
  stopEvent: (e: Event) => {
    if (e instanceof DragEvent) return false;
    return true;
  }
});

export default codeblockSettings;
