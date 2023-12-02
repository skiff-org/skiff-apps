import { ThemeMode, Typography, getThemedColor, Icons, Icon } from 'nightwatch-ui';
import React from 'react';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { storeWorkspaceEvent } from '../../../utils/userUtils';

export enum ActivationTask {
  DOWNLOAD_APP = 'DOWNLOAD_APP',
  IMPORT_MAIL = 'IMPORT_MAIL',
  ADD_ALIAS = 'ADD_ALIAS',
  ADD_RECOVERY_EMAIL = 'ADD_RECOVERY_EMAIL'
}

export enum ActivationPromo {
  TRANSFER_DOMAIN = 'TRANSFER_DOMAIN',
  BUY_DOMAIN = 'BUY_DOMAIN'
}

export interface ActivationChecklistItem {
  task: ActivationTask | ActivationPromo;
  title: string;
  onClick: () => void;
  complete?: boolean;
}

interface ChecklistProps {
  items: ActivationChecklistItem[];
}

const ChecklistContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ChecklistRowContainer = styled.div<{ lastItem?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px;
  transition: all 0.2s cubic-bezier(0.3, 0, 0.5, 1);
  cursor: pointer;
  &:hover {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
  }
  ${(props) => props.lastItem && 'border-radius: 0 0 8px 8px;'}
`;

const ChecklistRowIconAndText = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckContainer = styled.div<{ complete?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  background: ${(props) =>
    props.complete ? getThemedColor('var(--accent-blue-primary)', ThemeMode.DARK) : 'var(--bg-emphasis)'};
  outline: 2px solid
    ${(props) =>
      props.complete
        ? getThemedColor('var(--accent-blue-secondary)', ThemeMode.DARK)
        : getThemedColor('var(--border-primary)', ThemeMode.DARK)};
`;

interface ActivationChecklistItemProps extends ActivationChecklistItem {
  lastItem?: boolean;
}

const ActivationChecklistRow: React.FC<ActivationChecklistItemProps> = ({
  title,
  complete,
  onClick,
  task,
  lastItem
}) => {
  return (
    <ChecklistRowContainer
      lastItem={lastItem}
      onClick={() => {
        onClick();
        void storeWorkspaceEvent(
          WorkspaceEventType.ActivationChecklistItemClick,
          task,
          DEFAULT_WORKSPACE_EVENT_VERSION
        );
      }}
    >
      <ChecklistRowIconAndText>
        {/* color changes when all are complete; checkbox only applicable to tasks required for unlocking the trial */}
        {Object.values(ActivationTask).includes(task as ActivationTask) && (
          <CheckContainer complete={complete}>
            {complete ? <Icons color='white' icon={Icon.Check} /> : null}
          </CheckContainer>
        )}
        <Typography color='secondary' forceTheme={ThemeMode.DARK}>
          {title}
        </Typography>
      </ChecklistRowIconAndText>
      <Icons color='disabled' forceTheme={ThemeMode.DARK} icon={Icon.ChevronRight} />
    </ChecklistRowContainer>
  );
};

const ActivationChecklist: React.FC<ChecklistProps> = ({ items }) => {
  return (
    <ChecklistContainer>
      {items.map((item, index) => (
        <ActivationChecklistRow key={item.title} {...item} lastItem={index === items.length - 1} />
      ))}
    </ChecklistContainer>
  );
};

export default ActivationChecklist;
