import {
  Color,
  Icon,
  Icons,
  getAccentColorValues,
  Typography,
  isAccentColor,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { DEFAULT_FILE_TITLE } from '../../../../constants';
import { PreviewObject } from '../RecentFilePreview.types';

const FilePreviewDocThumbnail = styled.div`
  pointer-events: none;
  width: 100%;
  height: fit-content;
  background: var(--bg-l3-solid);

  & > div {
    transform-origin: 0 0;
    -webkit-transform: inherit;
    width: 100%;
    text-align: start;
    overflow-wrap: break-word;
    margin-top: -56px;
    padding: 0px 24px;
    box-sizing: border-box;
  }

  & * {
    font-size: 8px;
  }

  & h1 {
    font-size: 15px !important;
  }

  & > div > p > img {
    max-width: 100%;
  }

  & ul {
    padding-inline-start: 20px;
  }

  & p:empty {
    display: table;
  }
`;

const FilePreviewName = styled.div<{ $isShort?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px 24px 0px 24px;
  gap: 4px;
  z-index: 2;
  background: ${(props) => (!props.$isShort ? 'var(--bg-l3-solid)' : '')};
`;

const ShortName = styled.div`
  padding: 8px 24px;
`;

const IconBox = styled.div<{ bgColor?: string }>`
  padding: 8px;
  max-width: 24px;
  aspect-ratio: 1;
  /* justify-content: center; */
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 8px;
  background: ${(props) => props.bgColor ?? 'var(--bg-field-default)'};
`;

const RichTextPreviewContainer = styled.div`
  display: inline-flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-l3-solid);
`;

const PAGE_THRESHOLD = 100;

const SkiffPagePreview = ({
  data,
  color,
  title = DEFAULT_FILE_TITLE,
  icon = Icon.File
}: PreviewObject & { color?: Color; title?: string; icon?: Icon }) => {
  const docRef = useRef<HTMLDivElement>(null);
  const [docHeight, setDocHeight] = useState<number | null>();

  useEffect(() => {
    setDocHeight(docRef?.current?.getBoundingClientRect().height);
  }, [docRef]);

  const isShort = !!docHeight && docHeight < PAGE_THRESHOLD;
  const secondaryColor: string | undefined =
    !!color && isAccentColor(color) ? getAccentColorValues(color)[1] : undefined;

  return (
    <RichTextPreviewContainer>
      <FilePreviewName $isShort={isShort}>
        <IconBox bgColor={secondaryColor}>
          <Icons color={color} icon={icon} />
        </IconBox>
      </FilePreviewName>
      {isShort && (
        <ShortName>
          <Typography weight={TypographyWeight.BOLD}>{title}</Typography>
        </ShortName>
      )}
      {!isShort && <FilePreviewDocThumbnail dangerouslySetInnerHTML={{ __html: data }} ref={docRef} />}
    </RichTextPreviewContainer>
  );
};

export default SkiffPagePreview;
