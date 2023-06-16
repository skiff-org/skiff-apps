import { Icon, Icons, Size } from 'nightwatch-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { Page, Document as ReactPDFDocument } from '../../../ReactPdf';
import { PreviewObject, PreviewSize } from '../RecentFilePreview.types';

const PDFWrapperDiv = styled.div`
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;

  ${isMobile &&
  `
    canvas {
      width: 100% !important;
      height: auto !important;
    }
    `}
`;

const PdfIconContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
`;

const FallbackIcon = ({ size, icon }: { size: PreviewSize; icon?: Icon }) => {
  return (
    <PdfIconContainer>
      <Icons color='secondary' icon={icon || Icon.Pdf} size={size === PreviewSize.Small ? Size.MEDIUM : Size.X_LARGE} />
    </PdfIconContainer>
  );
};

const PDFPreview = ({ data, tryToOpenProtectedPdf, size }: PreviewObject & { size: PreviewSize }) => {
  const [protectedPdf, setProtectedPdf] = useState(false);
  const [numPages, setNumPages] = useState(0);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    setNumPages(nextNumPages);
  }

  function onPassword(callback: (pass: string) => void) {
    if (!tryToOpenProtectedPdf) {
      setProtectedPdf(true);
      return;
    }
    const password = prompt('Enter password to open this file.');
    if (!password) setProtectedPdf(true);
    callback(password ?? '');
  }

  if (!data.length) return <FallbackIcon size={size} />;

  return (
    <PDFWrapperDiv>
      {protectedPdf ? (
        <FallbackIcon icon={Icon.FileLock} size={size} />
      ) : (
        <ReactPDFDocument
          file={data}
          loading={<FallbackIcon size={size} />}
          onLoadSuccess={onDocumentLoadSuccess}
          onPassword={onPassword}
        >
          {Array.from(new Array(numPages), (_el, index) => (
            <Page key={`page_${index + 1}`} loading={<FallbackIcon size={size} />} pageNumber={index + 1} />
          ))}
        </ReactPDFDocument>
      )}
    </PDFWrapperDiv>
  );
};
export default PDFPreview;
