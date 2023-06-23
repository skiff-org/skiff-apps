import { IconText } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

import { FileTableAction } from './FileTable.types';

const FileTableToolbar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface FileTableActionsProps {
  actions: FileTableAction[];
}

/**
 * File table Actions
 *
 * Component for rendering actions that modify items in the File table (e.g. delete, move, duplicate, share).
 *
 */
const FileTableActions: React.FC<FileTableActionsProps> = ({ actions }) => {
  return (
    <FileTableToolbar>
      <Toolbar>
        {actions.map((action) => {
          const { key, icon, onClick, tooltip, dataTest } = action;
          return (
            <IconText
              dataTest={dataTest}
              iconColor='secondary'
              key={key}
              onClick={onClick}
              startIcon={icon}
              tooltip={tooltip}
            />
          );
        })}
      </Toolbar>
    </FileTableToolbar>
  );
};

export default FileTableActions;
