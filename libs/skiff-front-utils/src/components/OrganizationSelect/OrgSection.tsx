import { Icons, Size, ThemeMode, Typography, TypographySize } from '@skiff-org/skiff-ui';

import {
  ActionItem,
  ActionLabel,
  Actions,
  SectionAction,
  Sections,
  WorkspaceSection
} from './OrganizationSelect.constants';
import { WorkspaceAction } from './WorkspaceAction';
import { WorkspaceItem } from './WorkspaceItem';

interface OrgSectionProps {
  section?: WorkspaceSection;
  closeDropdown: () => void;
  actions?: Array<SectionAction>;
  disabled?: boolean;
}

export const OrgSection = (props: OrgSectionProps) => {
  const { actions, disabled, section, closeDropdown } = props;

  return (
    <Sections>
      <div>
        {section?.workspaces.map((workspace) => (
          <WorkspaceItem closeDropdown={closeDropdown} key={workspace.id} workspace={workspace} />
        ))}
        {section?.actions?.map((action) => (
          <WorkspaceAction action={action} disabled={disabled} key={action.key} />
        ))}
      </div>
      {!!actions && (
        <>
          <Actions $disabled={disabled}>
            {actions.map((action) => (
              <ActionItem data-test={action?.dataTest} key={action?.key} onClick={action.onClick}>
                <ActionLabel $disabled={disabled}>
                  <Typography mono uppercase color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
                    {action.label}
                  </Typography>
                  {action?.icon && (
                    <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={action.icon} size={Size.SMALL} />
                  )}
                </ActionLabel>
              </ActionItem>
            ))}
          </Actions>
        </>
      )}
    </Sections>
  );
};
