import uniqueId from 'lodash/uniqueId';
import { Icon, IconComponent, IconText, IconTextProps } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

// Setting min-width to 0 keeps the flex-box from overflowing
const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0px;
`;

const IconTextContainer = styled.div`
  min-width: 0px;
`;

const StartActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0px;
`;

const EndActions = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`;

export interface IconTextEndAction {
  icon: Icon | IconComponent;
  onClick: (e?: React.MouseEvent) => void;
  tooltip?: string;
  dataTest?: string;
  buttonRef?: React.RefObject<HTMLDivElement>;
}

export interface IconTextWithEndActionsProps extends IconTextProps {
  endActions: IconTextEndAction[];
  showEndActions?: boolean;
  startComponent?: JSX.Element;
}

const IconTextWithEndActions: React.FC<IconTextWithEndActionsProps> = ({
  endActions,
  forceTheme,
  showEndActions = true,
  startComponent,
  ...iconTextProps
}: IconTextWithEndActionsProps) => {
  return (
    <Wrapper>
      <StartActions>
        {startComponent}
        <IconTextContainer>
          <IconText {...iconTextProps} />
        </IconTextContainer>
      </StartActions>
      {showEndActions && (
        <EndActions>
          {endActions.map((endAction) => {
            return (
              <IconText
                color='secondary'
                forceTheme={forceTheme}
                key={uniqueId('iconText-endAction')}
                onClick={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  endAction.onClick(e);
                }}
                ref={endAction.buttonRef}
                startIcon={endAction.icon}
                tooltip={endAction.tooltip}
              />
            );
          })}
        </EndActions>
      )}
    </Wrapper>
  );
};

export default IconTextWithEndActions;
