import { Icon, Icons, Size, ThemeMode, Tooltip, TooltipContent, TooltipTrigger, getThemedColor } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { ActionIcon } from '../FileViewer';

const ToolbarIconButtonContainer = styled.div`
  padding: 8px;

  border-radius: 6px;

  cursor: pointer;

  &:hover {
    background: ${getThemedColor('var(--bg-cell-hover)', ThemeMode.DARK)};
  }
`;

function ToolbarIconButton(
  { icon, key, onClick, tooltip, dataTest }: ActionIcon,
  ref: React.ForwardedRef<HTMLDivElement | null>
) {
  return (
    <Tooltip>
      <TooltipContent>{tooltip}</TooltipContent>
      <TooltipTrigger>
        <ToolbarIconButtonContainer data-test={dataTest} key={key} onClick={onClick} ref={ref}>
          <Icons
            color={icon === Icon.Trash ? 'destructive' : undefined}
            forceTheme={ThemeMode.DARK}
            icon={icon}
            size={Size.MEDIUM}
          />
        </ToolbarIconButtonContainer>
      </TooltipTrigger>
    </Tooltip>
  );
}

export default React.forwardRef<HTMLDivElement | null, ActionIcon>(ToolbarIconButton);
