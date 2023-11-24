import DOMPurify from 'dompurify';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

const TextPreviewContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  padding: 40px;
`;

const StyledIframe = styled.iframe`
  box-sizing: border-box;
  background: white;
  min-width: 100%;
  height: 700px;
  border-radius: 4px;
  border: 0px solid white;
  font-family: 'Skiff Sans Text';
`;

const TextPreview: PreviewComponent = ({ data }: PreviewComponentProps) => {
  const [previewHTML, setPreviewHTML] = useState('');

  useEffect(() => {
    const fetchHtml = async () => {
      if (data.startsWith('blob:')) {
        const res = await fetch(data);
        const blob = await res.blob();
        const textVal = await blob.text();
        const { marked } = await import('marked');
        const docHTML = DOMPurify.sanitize(marked(textVal));
        setPreviewHTML(docHTML);
      }
    };
    void fetchHtml();
  }, [data]);

  return (
    <TextPreviewContainer>
      {previewHTML && (
        <StyledIframe
          id='iframe'
          sandbox='allow-popups-to-escape-sandbox'
          srcDoc={previewHTML}
          title='Document Preview'
        />
      )}
    </TextPreviewContainer>
  );
};

export default TextPreview;
