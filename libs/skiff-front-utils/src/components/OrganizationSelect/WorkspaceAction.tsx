import { Icons, Size, ThemeMode, Typography, TypographySize } from '@skiff-org/skiff-ui';
import { useState } from 'react';

import {
  ActionIconWrapper,
  SectionAction,
  WorkspaceItemContainer,
  WorkspaceLabels
} from './OrganizationSelect.constants';

interface WorkspaceActionProps {
  action: SectionAction;
  disabled?: boolean;
}

export const WorkspaceAction = (props: WorkspaceActionProps) => {
  const { action, disabled } = props;
  const [hover, setHover] = useState(false);
  return (
    <WorkspaceItemContainer
      $disabled={disabled}
      data-test={action?.dataTest}
      key={action?.key}
      onClick={action.onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {action?.icon && (
        <ActionIconWrapper $active={hover && !disabled}>
          <Icons forceTheme={ThemeMode.DARK} icon={action.icon} size={Size.SMALL} />
        </ActionIconWrapper>
      )}
      <WorkspaceLabels>
        <Typography
          mono
          uppercase
          color={hover && !disabled ? 'primary' : 'secondary'}
          forceTheme={ThemeMode.DARK}
          size={TypographySize.SMALL}
        >
          {action.label}
        </Typography>
      </WorkspaceLabels>
    </WorkspaceItemContainer>
  );
};
