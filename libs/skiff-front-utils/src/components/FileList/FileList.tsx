import { Icon, IconText, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { bytesToHumanReadable } from 'skiff-utils';
import styled, { css } from 'styled-components';

interface FileListProps {
  /**
   * Dictionary store of files hashed by their identifier.
   */
  files: Record<string, File>;
  /**
   * Callback for file removal.
   * @param {string} fileID Identifier of the file to remove.
   */
  onFileRemoved: (fileID: string) => void;
}

const Files = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  max-height: 27vh;
  flex-flow: wrap;
  ${isMobile &&
  css`
    overflow: auto;
  `}
  ${!isMobile &&
  css`
    overflow: hidden;
    :hover {
      overflow: auto;
    }
  `}
`;

const FileRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px 2px 2px 6px;
  gap: 8px;
  box-sizing: border-box;
  justify-content: space-between;
  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-tertiary);
  border-radius: 8px;
`;

const LabelContainer = styled.div`
  display: flex;
  max-width: 100%;
  gap: 4px;
  align-items: center;
`;

const ImageText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 20px;
`;

const IconContainer = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileList: React.FC<FileListProps> = ({ files, onFileRemoved }) => (
  <Files>
    {Object.entries(files).map(([fileID, file]) => (
      <FileRow key={`wrapper-${fileID}`}>
        <ImageText>
          <IconContainer src={URL.createObjectURL(file)} />
          <LabelContainer>
            <Typography color='secondary' weight={TypographyWeight.MEDIUM}>
              {file.name.split('.')[0]}
            </Typography>
            <Typography color='disabled' mono size={TypographySize.SMALL}>
              {bytesToHumanReadable(file.size)}
            </Typography>
          </LabelContainer>
        </ImageText>
        <IconText color='disabled' onClick={() => onFileRemoved(fileID)} size={Size.SMALL} startIcon={Icon.Close} />
      </FileRow>
    ))}
  </Files>
);

export default FileList;
