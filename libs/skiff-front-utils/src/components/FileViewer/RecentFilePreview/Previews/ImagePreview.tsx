import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

// when using mobile, should force width to be 100%.
// when using desktop, to be max of 75vh (unless overridden by the prop)
const StyledImg = styled.img<{ $compact?: boolean; $maxHeight?: string }>`
  user-select: none;
  ${(props) =>
    !isMobile &&
    !props.$compact &&
    `
    height: 80%;
    gap: 2px;
    max-width: 100%;
  `}

  ${(props) =>
    !isMobile &&
    props.$compact &&
    `
    width: auto;
    height: 100%;
    overflow: hidden;
  `}

  ${(props) =>
    isMobile &&
    props.$compact &&
    `
    width: auto;
    max-width: 36px;
    height: 36px;
    border: 1px solid var(--border-secondary);
    border-bottom: 2px solid var(--border-secondary);
    aspect-ratio: 1;
    border-radius: 8px;
    box-sizing: border-box;
  `}
  ${(props) =>
    isMobile &&
    !props.$compact &&
    `
    width: auto;
    max-height: 60vh;
  `}
`;

const ImagePreview: PreviewComponent = ({ data, compact, maxHeight }: PreviewComponentProps) => {
  return <StyledImg $compact={compact} $maxHeight={maxHeight} draggable={false} src={data} />;
};

export default ImagePreview;
