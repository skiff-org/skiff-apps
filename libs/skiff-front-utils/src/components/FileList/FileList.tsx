import { FilledVariant, Icon, IconButton, Size, Type, Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import React from 'react';
import { bytesToHumanReadable } from 'skiff-utils';
import styled from 'styled-components';

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
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-height: 27vh;
  overflow: auto;
`;

const FileRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 12px 4px 4px;
  box-sizing: border-box;
  justify-content: space-between;
  width: 100%;
  background: var(--bg-l2-solid);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
`;

const LabelContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;

const ImageText = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  max-width: 80%;
`;

const IconContainer = styled.img`
  width: 40px;
  height: 40px;
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
            <Typography mono uppercase weight={TypographyWeight.MEDIUM}>
              {file.name.split('.')[0]}
            </Typography>
            <Typography mono uppercase color='secondary'>
              {file.type.split('/')[1].toUpperCase()} / {bytesToHumanReadable(file.size)}
            </Typography>
          </LabelContainer>
        </ImageText>
        <IconButton
          icon={Icon.Close}
          onClick={() => onFileRemoved(fileID)}
          size={Size.SMALL}
          type={Type.SECONDARY}
          variant={FilledVariant.UNFILLED}
        />
      </FileRow>
    ))}
  </Files>
);

export default FileList;
