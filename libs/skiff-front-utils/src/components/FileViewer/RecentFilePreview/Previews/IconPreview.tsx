import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

// when using mobile, should force width to be 100%.
// when using desktop, should force height to be max of 75vh.
const StyledSvgImg = styled.img`
  user-select: none;
  ${!isMobile &&
  ` max-width: 100%;
    max-height: 75vh
  `}
  ${isMobile &&
  `
    width: 100%;
    max-height: 60vh;
  `}
`;

const IconPreview: PreviewComponent = ({ data }: PreviewComponentProps) => {
  const [svgSrc, setSvgSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    const fetchSrc = async () => {
      if (data.startsWith('blob:')) {
        const res = await fetch(data);
        const blob = await res.blob();
        const textVal = await blob.text();
        setSvgSrc(textVal);
      }
    };
    void fetchSrc();
  }, [data]);

  return <StyledSvgImg src={svgSrc && `data:image/svg+xml;utf8,${encodeURIComponent(svgSrc)}`} />;
};

export default IconPreview;
