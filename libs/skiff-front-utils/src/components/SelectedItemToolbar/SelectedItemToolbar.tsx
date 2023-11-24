import { Divider, DividerType, ThemeMode, Typography } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { ActionIcon } from '../FileViewer';

import ToolbarIconButton from './ToolbarIconButton';

const BOTTOM_BAR_HEIGHT = 36;

const BottomBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  height: ${BOTTOM_BAR_HEIGHT}px;
  width: fit-content;
  padding: 2px;

  position: fixed;
  left: 50%;
  bottom: 21px;
  transform: translateX(-50%);

  background: var(--bg-emphasis);

  box-shadow: var(--shadow-l3);
  border-radius: 8px;
  z-index: 99999999999;
`;

const DividerContainer = styled.div`
  padding: 4px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 8px;
  gap: 8px;
`;

interface SelectedItemToolbarProps {
  topText: string;
  actions: ActionIcon[];
  subText?: string;
}

const SelectedItemToolbar: React.FC<SelectedItemToolbarProps> = ({ topText, actions, subText }) => {
  return (
    <BottomBarContainer>
      <TextContainer>
        <Typography forceTheme={ThemeMode.DARK}>{topText}</Typography>
        {!!subText && (
          <Typography color='secondary' forceTheme={ThemeMode.DARK}>
            {subText}
          </Typography>
        )}
      </TextContainer>
      <DividerContainer>
        <Divider
          color='primary'
          forceTheme={ThemeMode.DARK}
          height={`${BOTTOM_BAR_HEIGHT - 8}px`}
          type={DividerType.VERTICAL}
        />
      </DividerContainer>
      {actions.map(({ icon, onClick, tooltip, key, dataTest, ref }) => (
        <ToolbarIconButton dataTest={dataTest} icon={icon} key={key} onClick={onClick} ref={ref} tooltip={tooltip} />
      ))}
    </BottomBarContainer>
  );
};

export default SelectedItemToolbar;
