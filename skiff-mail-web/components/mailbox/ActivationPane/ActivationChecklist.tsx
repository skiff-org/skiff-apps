import { ThemeMode, Typography, getThemedColor, Icons, Icon, Size } from 'nightwatch-ui';
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

export interface ActivationChecklistItem {
  task: ActivationTask;
  title: string;
  complete: boolean;
  onClick: () => void;
}

interface ChecklistProps {
  items: ActivationChecklistItem[];
  allItemsComplete?: boolean;
}

const ChecklistContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ChecklistRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  padding: 12px 8px 12px 0;
  transition: all 0.2s cubic-bezier(0.3, 0, 0.5, 1);
  cursor: pointer;
  &:hover {
    background: ${getThemedColor('var(--bg-overlay-tertiary)', ThemeMode.DARK)};
  }
`;

const ChecklistRowIconAndText = styled.div`
  display: flex;
  padding-left: 12px;
  align-items: center;
  gap: 16px;
`;

const CheckContainer = styled.div<{ selfComplete?: boolean; allComplete?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  background: ${(props) =>
    props.selfComplete
      ? props.allComplete
        ? getThemedColor('var(--accent-green-primary)', ThemeMode.DARK)
        : getThemedColor('var(--accent-blue-primary)', ThemeMode.DARK)
      : 'var(--bg-emphasis)'};
  outline: 2px solid
    ${(props) =>
      props.selfComplete
        ? props.allComplete
          ? getThemedColor('var(--accent-green-secondary)', ThemeMode.DARK)
          : getThemedColor('var(--accent-blue-secondary)', ThemeMode.DARK)
        : getThemedColor('var(--border-primary)', ThemeMode.DARK)};
`;

interface ActivationChecklistRowProps extends ActivationChecklistItem {
  allItemsComplete?: boolean;
}

const ActivationChecklistRow: React.FC<ActivationChecklistRowProps> = ({
  title,
  complete,
  onClick,
  task,
  allItemsComplete
}) => {
  return (
    <ChecklistRowContainer
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
        {/* color changes when all are complete */}
        <CheckContainer allComplete={allItemsComplete} selfComplete={complete}>
          {complete ? <Icons color='black' icon={Icon.Check} size={Size.X_MEDIUM} /> : null}
        </CheckContainer>
        <Typography color='white'>{title}</Typography>
      </ChecklistRowIconAndText>
      <Icons color='disabled' forceTheme={ThemeMode.DARK} icon={Icon.ChevronRight} size={Size.X_MEDIUM} />
    </ChecklistRowContainer>
  );
};

const ActivationChecklist: React.FC<ChecklistProps> = ({ items, allItemsComplete }) => {
  return (
    <ChecklistContainer>
      {items.map((item) => (
        <ActivationChecklistRow key={item.title} {...item} allItemsComplete={allItemsComplete} />
      ))}
    </ChecklistContainer>
  );
};

export default ActivationChecklist;
