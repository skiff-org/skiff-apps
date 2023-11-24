import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { mbToBytes } from 'skiff-utils';
import styled from 'styled-components';

import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

const DocxPreviewContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  padding: 40px;
  height: 100%;
  box-sizing: border-box;
  ${isMobile ? 'padding: 16px;' : ''}
`;

const StyledIframe = styled.iframe`
  box-sizing: border-box;
  background: white;
  min-width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 0px solid white;
  font-family: 'Skiff Sans Text';
`;

// max docx file size
const MAX_DOCX_SIZE_BYTES = mbToBytes(50);

const DocxPreview: PreviewComponent = ({ data }: PreviewComponentProps) => {
  const [documentHtml, setDocumentHtml] = useState<string>('');

  useEffect(() => {
    const getPreview = async () => {
      if (data.length > MAX_DOCX_SIZE_BYTES) {
        console.error('Docx too large to preview');
        return;
      }
      let result: { value: string } | undefined = undefined;
      if (data.startsWith('blob:')) {
        const res = await fetch(data);
        const blob = await res.blob();
        const mammoth = (await import('mammoth')).default;
        result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
      } else if (data.startsWith('data:')) {
        const mammoth = (await import('mammoth')).default;
        const byteString = window.atob(data.split(',')[1] ?? '');
        // separate out the mime component
        // write the bytes of the string to an ArrayBuffer
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        // set the bytes of the buffer to the correct values
        for (let idx = 0; idx < byteString.length; idx++) {
          ia[idx] = byteString.charCodeAt(idx);
        }
        result = await mammoth.convertToHtml({ arrayBuffer: ab });
      }
      if (!result) {
        console.error('Docx preview failed');
        return;
      }
      // wrap html in div that sets font familty to Skiff Sans Text
      result.value = `<div style="font-family: 'Skiff Sans Text', system-ui, sans-serif; margin: 1in; min-height: 8in;">${result.value}</div>`;
      // Sanitize the HTML content before setting it
      const sanitizedHtml = DOMPurify.sanitize(result.value);
      setDocumentHtml(sanitizedHtml);
    };
    void getPreview();
  }, [data]);

  return (
    <DocxPreviewContainer>
      {documentHtml && (
        <StyledIframe
          id='iframe'
          sandbox='allow-popups-to-escape-sandbox'
          srcDoc={documentHtml}
          title='Document Preview'
        />
      )}
    </DocxPreviewContainer>
  );
};

export default DocxPreview;
