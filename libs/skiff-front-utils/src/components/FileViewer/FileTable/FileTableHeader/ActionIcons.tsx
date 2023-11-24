import { IconText } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { ActionIcon } from './FileTable.types';

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

interface ActionIconsProps {
  actions: ActionIcon[];
}

/**
 * File table Actions
 *
 * Component for rendering actions that modify items in the File table (e.g. delete, move, duplicate, share).
 *
 */
const ActionIcons: React.FC<ActionIconsProps> = ({ actions }) => {
  return (
    <FileTableToolbar>
      <Toolbar>
        {actions.map((action) => {
          const { key, icon, onClick, tooltip, dataTest } = action;
          return (
            <IconText
              color='secondary'
              dataTest={dataTest}
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

export default ActionIcons;
