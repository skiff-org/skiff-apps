import { useEffect, useRef, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import styled from 'styled-components';

import { PreviewObject } from '../RecentFilePreview.types';

import { CodeBlockLanguages, getLanguageFromMimeType } from './CodePreviewLang';
import customTheme from './CodeTheme';

const CodeBlockContainer = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
  overflow: auto;
  color: #d4d4d4;
`;

const supportedLanguagesImports: Record<CodeBlockLanguages, () => Promise<any>> = {
  [CodeBlockLanguages.javascript]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/javascript'),
  [CodeBlockLanguages.typescript]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/typescript'),
  [CodeBlockLanguages.python]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/python'),
  [CodeBlockLanguages.cpp]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/cpp'),
  [CodeBlockLanguages.java]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/java'),
  [CodeBlockLanguages.css]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/css'),
  [CodeBlockLanguages.json]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/json'),
  [CodeBlockLanguages.bash]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/bash'),
  [CodeBlockLanguages.sql]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/sql'),
  [CodeBlockLanguages.go]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/go'),
  [CodeBlockLanguages.ruby]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/ruby'),
  [CodeBlockLanguages.php]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/php'),
  [CodeBlockLanguages.swift]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/swift'),
  [CodeBlockLanguages.kotlin]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/kotlin'),
  [CodeBlockLanguages.rust]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/rust'),
  [CodeBlockLanguages.csharp]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/csharp'),
  [CodeBlockLanguages.scala]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/scala'),
  [CodeBlockLanguages.perl]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/perl'),
  [CodeBlockLanguages.objectivec]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/objectivec'),
  [CodeBlockLanguages.lua]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/lua'),
  [CodeBlockLanguages.r]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/r'),
  [CodeBlockLanguages.matlab]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/matlab'),
  [CodeBlockLanguages.powershell]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/powershell'),
  [CodeBlockLanguages.dart]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/dart'),
  [CodeBlockLanguages.html]: () => import('react-syntax-highlighter/dist/esm/languages/hljs/xml') // Using 'xml' for HTML
};

const CodePreview = ({ data, mimeType, isEmbeddedInPage }: PreviewObject & { isEmbeddedInPage?: boolean }) => {
  const [value, setValue] = useState<string>('');
  const [languageLoaded, setLanguageLoaded] = useState<boolean>(false);
  const [focusedLine, setFocusedLine] = useState<number | null>(null);
  const focusedLineRef = useRef<HTMLDivElement>(null);

  // Get the language based on mimeType using the helper function
  const language = getLanguageFromMimeType(mimeType || '');

  const lines = !value ? [] : value.split('\n');
  const lineNumbers = lines.map((_: any, index: number) => index + 1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' && focusedLine !== null) {
        event.preventDefault();
        setFocusedLine((prevLine) => (prevLine && prevLine > 1 ? prevLine - 1 : 1));
      } else if (event.key === 'ArrowDown' && focusedLine !== null) {
        event.preventDefault();
        setFocusedLine((prevLine) => (prevLine && prevLine < lineNumbers.length ? prevLine + 1 : lineNumbers.length));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedLine, lineNumbers.length]);

  useEffect(() => {
    const importLanguages = async () => {
      const imports = Object.values(supportedLanguagesImports).map((importFunc) => importFunc());
      setLanguageLoaded(false);
      const languages = await Promise.all(imports);
      Object.keys(supportedLanguagesImports).forEach((key, index) => {
        const languageSyntax = languages[index].default;
        SyntaxHighlighter.registerLanguage(key, languageSyntax);
      });
      setLanguageLoaded(true);
    };

    void importLanguages();
  }, []);

  useEffect(() => {
    if (focusedLineRef?.current) {
      focusedLineRef?.current.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedLine]);

  useEffect(() => {
    const getPreview = async () => {
      if (data.startsWith('blob:')) {
        const res = await fetch(data);
        const text = await res.text();
        setValue(text || '');
      }
    };
    void getPreview();
  }, [data]);

  const handleLineMouseDown = (lineNumber: number) => {
    setFocusedLine(lineNumber);
  };

  if (!value || !language || !languageLoaded) return <></>;

  return (
    <CodeBlockContainer>
      <SyntaxHighlighter
        codeTagProps={{
          style: {
            color: '#d4d4d4 !important',
            margin: '0 !important',
            fontFamily: 'Skiff Mono, monospace !important',
            fontSize: '13px !important',
            lineHeight: '130% !important',
            fontWeight: '300 !important'
          }
        }}
        language={language}
        lineNumberStyle={{
          color: '#949494',
          fontFamily: 'Skiff Mono, monospace !important',
          fontSize: '13px !important',
          lineHeight: '130% !important',
          fontWeight: '300 !important'
        }}
        lineProps={(lineNumber) => {
          const style: any = {
            display: 'block',
            width: '100%',
            color: '#d4d4d4 !important',
            fontFamily: 'Skiff Mono, monospace !important',
            fontSize: '13px !important',
            lineHeight: '130% !important',
            fontWeight: '300 !important'
          };
          if (lineNumber === focusedLine) {
            style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            return { style, onMouseDown: () => handleLineMouseDown(lineNumber), ref: focusedLineRef };
          }
          return { style, onMouseDown: () => handleLineMouseDown(lineNumber) };
        }}
        showLineNumbers
        style={customTheme}
        wrapLines
      >
        {value}
      </SyntaxHighlighter>
    </CodeBlockContainer>
  );
};

export default CodePreview;
