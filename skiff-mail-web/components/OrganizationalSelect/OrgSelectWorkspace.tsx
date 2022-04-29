import { Avatar, Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

import { AccentColor } from '../../../skiff-ui/src/utils/colorUtils';

const Checkmark = styled.div`
  margin-left: auto;
`;

const Labels = styled.div`
  display: flex;
  flex-direction: column;
  width: 70%;
`;

const OrgSelectWorkspaceContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  gap: 12px;
  border-radius: 8px;
  box-sizing: border-box;
  width: 100%;

  &:hover {
    background: var(--bg-cell-hover);
  }
`;

interface OrgSelectActionProps {
  active?: boolean;
  label: string;
  subLabel?: string;
  onClick?: () => void;
  color?: AccentColor;
  icon?: Icon;
}

const OrgSelectWorkspace: React.FC<OrgSelectActionProps> = ({ active, label, subLabel, onClick, icon, color }) => (
  <OrgSelectWorkspaceContainer onClick={onClick}>
    <Avatar color={color} icon={icon} label={label} />
    <Labels>
      <Typography>{label}</Typography>
      {subLabel && (
        <Typography color='tertiary' level={3} type='paragraph'>
          {subLabel}
        </Typography>
      )}
    </Labels>
    {active && (
      <Checkmark>
        <Icons icon={Icon.Check} />
      </Checkmark>
    )}
  </OrgSelectWorkspaceContainer>
);

export default OrgSelectWorkspace;
