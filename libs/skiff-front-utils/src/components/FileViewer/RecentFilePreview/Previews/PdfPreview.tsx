import { CircularProgress, getThemedColor, Icon, IconText, Size, ThemeMode } from 'nightwatch-ui';
import { useEffect, useState } from 'react';
import { isAndroid, isEdge, isFirefox, isIE, isMobile, isSafari } from 'react-device-detect';
import styled, { css } from 'styled-components';
import { Page, Document as ReactPDFDocument } from '../../../ReactPdf';

import { PreviewObject, PreviewSize } from '../RecentFilePreview.types';

import { pdfAnnotationsStyles } from './PdfAnnotationsStyles';

const PDFWrapperDiv = styled.div<{ $embeddedInPage?: boolean }>`
  height: 100%;
  overflow: ${({ $embeddedInPage }) => ($embeddedInPage ? 'hidden' : 'auto')};

  display: flex;
  justify-content: center;
  ${pdfAnnotationsStyles}

  .react-pdf__Page {
    margin: 1em;
  }

  .react-pdf__message--loading {
    height: 100%;
  }

  ${isMobile &&
  `
    canvas {
      width: 100% !important;
      height: auto !important;
    }
    `}

  ${({ $embeddedInPage }) =>
    $embeddedInPage &&
    !isMobile &&
    css`
      canvas {
        width: 100% !important;
        height: auto !important;
      }
    `}
  ${!isMobile &&
  css`
    ::-webkit-scrollbar {
      width: 12px;
    }
    /* This is the scrollbar thumb */
    ::-webkit-scrollbar-thumb {
      background: ${getThemedColor('var(--border-primary)', ThemeMode.DARK)}; /* color of the scroll thumb */
      border-radius: 20px; /* roundness of the scroll thumb */
      border: 3px solid transparent; /* creates padding around scroll thumb */
      background-clip: content-box; /* ensures padding doesn't take on the background color */
    }

    ::-webkit-scrollbar-corner {
      background: transparent;
    }
    /* When you hover over the scrollbar */
    ::-webkit-scrollbar-thumb:hover {
      background: ${getThemedColor('var(--cta-secondary-hover)', ThemeMode.DARK)}; /* color of the scroll thumb */
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

const ZoomContainer = styled.div`
  position: absolute;
  display: flex;
  z-index: 999999;
  align-items: center;
  right: 16px;
  bottom: 16px;
  padding: 4px;
  border-radius: 8px;
  box-shadow: ${getThemedColor('var(--shadow-l1)', ThemeMode.DARK)};
  background: ${getThemedColor('var(--bg-l0-solid)', ThemeMode.DARK)};
`;

const StyledEmbed = styled.embed`
  display: block;
  margin: auto;
  width: 100%;
`;

enum FitToPage {
  Horizontal = 'FitH',
  Vertical = 'FitV'
}

const FallbackIcon = () => {
  return (
    <PdfIconContainer>
      <CircularProgress forceTheme={ThemeMode.DARK} spinner />
    </PdfIconContainer>
  );
};

const ZOOM_INCREMENT = 10;

const PDFPreview = ({
  data,
  tryToOpenProtectedPdf,
  isEmbeddedInPage,
  reactPdf,
  width
}: PreviewObject & { size: PreviewSize; isEmbeddedInPage?: boolean; width?: number; reactPdf?: boolean }) => {
  const [protectedPdf, setProtectedPdf] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [zoom, setZoom] = useState<number>(100); // default zoom level
  const [fitToPage, setFitToPage] = useState<FitToPage | null>(FitToPage.Horizontal);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    if (isEmbeddedInPage) {
      setNumPages(1);
    } else {
      setNumPages(nextNumPages);
    }
  }

  const isChrome = !(isSafari || isFirefox || isEdge || isIE);

  useEffect(() => {
    async function fetchAndCreateBlobUrl() {
      try {
        const response = await fetch(data);
        if (!response.ok) {
          throw new Error('Failed to fetch PDF data.');
        }
        const blob = new Blob([await response.arrayBuffer()], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        // Important: Release the blob URL when component is unmounted
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error fetching PDF:', error);
        setProtectedPdf(true);
      }
    }

    fetchAndCreateBlobUrl();
  }, [data]);

  const handleZoomReset = () => {
    setZoom(100);
    setFitToPage(FitToPage.Horizontal);
  };

  const handleZoomIn = () => {
    setZoom((prev: number) => prev + ZOOM_INCREMENT);
    setFitToPage(null); // Reset fit to page when zooming
  };

  const handleZoomOut = () => {
    setZoom((prev: number) => prev - ZOOM_INCREMENT);
    setFitToPage(null); // Reset fit to page when zooming
  };

  const handleFitToPage = () => {
    if (!fitToPage) setFitToPage(FitToPage.Horizontal);
    else if (fitToPage === FitToPage.Horizontal) setFitToPage(FitToPage.Vertical);
    else if (fitToPage === FitToPage.Vertical) setFitToPage(FitToPage.Horizontal);
    else {
      setFitToPage(null);
    }
    if (zoom !== 100) {
      setZoom(100);
    } // Reset zoom level when fitting to page
  };

  function onPassword() {
    if (!tryToOpenProtectedPdf) {
      setProtectedPdf(true);
      return;
    }
    const password = prompt('Enter password to open this file.');
    if (!password) setProtectedPdf(true);
  }

  if (!blobUrl) return <FallbackIcon />;

  const embedSrc = isChrome
    ? `${blobUrl}#toolbar=0&navpanes=0&zoom=${zoom}${fitToPage ? `&view=${fitToPage}` : ''}`
    : blobUrl;

  if (isAndroid || reactPdf) {
    return (
      <PDFWrapperDiv $embeddedInPage={isEmbeddedInPage}>
        {protectedPdf ? (
          <FallbackIcon />
        ) : (
          <ReactPDFDocument
            file={data}
            loading={<CircularProgress forceTheme={ThemeMode.DARK} spinner />}
            onLoadError={(error) => console.log(error)}
            onLoadSuccess={onDocumentLoadSuccess}
            onPassword={onPassword}
          >
            {Array.from(new Array(numPages), (_el, index) => (
              <Page key={`page_${index + 1}`} loading={<FallbackIcon />} pageNumber={index + 1} />
            ))}
          </ReactPDFDocument>
        )}
      </PDFWrapperDiv>
    );
  }

  return (
    <PDFWrapperDiv
      $embeddedInPage={isEmbeddedInPage}
      onMouseEnter={() => setShowZoomControls(true)}
      onMouseLeave={() => setShowZoomControls(false)}
    >
      {isChrome && showZoomControls && (
        <ZoomContainer>
          <IconText
            color='primary'
            forceTheme={ThemeMode.DARK}
            onClick={handleFitToPage}
            size={Size.LARGE}
            startIcon={fitToPage === FitToPage.Vertical ? Icon.FitWidth : Icon.FitHeight}
            tooltip={fitToPage === FitToPage.Vertical ? 'Fit to width' : 'Fit to height'}
          />
          <IconText
            color='primary'
            forceTheme={ThemeMode.DARK}
            onClick={handleZoomReset}
            size={Size.LARGE}
            startIcon={Icon.ZoomPlus}
            tooltip='Reset zoom'
          />
          <IconText
            color='primary'
            forceTheme={ThemeMode.DARK}
            onClick={handleZoomIn}
            size={Size.LARGE}
            startIcon={Icon.Plus}
            tooltip='Zoom in'
          />
          <IconText
            color='primary'
            forceTheme={ThemeMode.DARK}
            onClick={handleZoomOut}
            size={Size.LARGE}
            startIcon={Icon.Minus}
            tooltip='Zoom out'
          />
        </ZoomContainer>
      )}
      {protectedPdf ? (
        <FallbackIcon />
      ) : (
        <StyledEmbed
          height='100%'
          key={`${zoom}-${fitToPage}`}
          src={embedSrc}
          type='application/pdf'
          width={width || '100%'}
        />
      )}
    </PDFWrapperDiv>
  );
};

export default PDFPreview;
