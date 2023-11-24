import { DropdownItem, IconText, IconTextSize, Size, ThemeMode, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { useGetDocumentBaseQuery } from 'skiff-front-graphql';
import { PermissionLevel } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';

import { canShareUsers } from '../../utils/sharingUtils';
import SelectField from '../SelectField';

export enum AccessUserType {
  EXISTING,
  NEW
}

type AccessLevelSelectProps = {
  /** docID for document being shared */
  docID: string;
  /** the selected permission set by the sharing select dropdown */
  selectedPermission: PermissionLevel;
  /** Whether the user being added is already shared on the doc/workspace
   * or is a new invite that hasn't yet been sent */
  userType: AccessUserType;
  /** update the selected permission */
  setSelectedPermission: (permission: PermissionLevel) => void;
  /** disabled by displaying label */
  disabled?: boolean;
  /** adds a row for removing access*/
  onRemoveClick?: () => void;
  dataTest?: string;
  theme?: ThemeMode;
  size?: IconTextSize;
  // Manually specify that the doc being shared is a team root
  // Works as an OR condition with the internal team root check in the component
  // Example use case: User selects "invite to workspace" option in share dropdown, but the active doc isn't the team root
  isTeamRoot?: boolean;
};

const getAvailablePermissionOptions = (
  isTeamRootDoc: boolean,
  userType: AccessUserType,
  userPrivilege: PermissionLevel | undefined
) => {
  const isAdmin = isTeamRootDoc && userPrivilege === PermissionLevel.Admin;
  const isExistingUser = userType === AccessUserType.EXISTING;
  if (!canShareUsers(userPrivilege)) {
    // viewers can't share any docs
    return undefined;
  }
  // team admins can make other existing users admins or editors
  if (isTeamRootDoc && isAdmin && isExistingUser) {
    return [PermissionLevel.Admin, PermissionLevel.Editor];
  }
  // team admins invite other people as editors
  if (isTeamRootDoc && isAdmin && !isExistingUser) {
    return [PermissionLevel.Editor];
  } else if (isTeamRootDoc && !isAdmin) {
    // team members can only share other members (so no dropdown)
    return undefined;
  } else {
    return [PermissionLevel.Editor, PermissionLevel.Viewer];
  }
};

/**
 * Stylized component for the select dropdown used to share
 * collaborators as either an editor or a viewer.
 */
const AccessLevelSelect: React.FC<AccessLevelSelectProps> = ({
  docID,
  disabled,
  userType,
  selectedPermission,
  setSelectedPermission,
  dataTest,
  onRemoveClick,
  theme,
  size = Size.MEDIUM,
  isTeamRoot
}) => {
  const { data } = useGetDocumentBaseQuery({
    variables: {
      request: {
        docID: docID
      }
    }
  });

  if (!docID) return null;

  const curDocument = data?.document;
  // sharing user's permissions
  const userPrivilege = curDocument?.currentUserPermissionLevel;

  const isTeamRootDoc = isTeamRoot || curDocument?.team?.rootDocument?.docID === docID;
  const permissionOptions = getAvailablePermissionOptions(isTeamRootDoc, userType, userPrivilege);

  // We use IconText instead of Typography for a more
  // accurate alignment with enabled Select elements
  const ghostLabel = (
    <IconText
      capitalize
      disabled
      forceTheme={theme}
      label={selectedPermission.toLowerCase()}
      size={size}
      weight={TypographyWeight.REGULAR}
    />
  );

  // invalid doc type/privilege for dropdown, or user = current user
  if (!permissionOptions || !permissionOptions?.length || !permissionOptions.includes(selectedPermission))
    return ghostLabel;

  const permissionItems = permissionOptions.map((option) => (
    <DropdownItem
      dataTest={`${upperCaseFirstLetter(option)}-dropdown-item`}
      key={option}
      label={upperCaseFirstLetter(option)}
      value={option}
    />
  ));

  if (onRemoveClick) {
    permissionItems.push(<DropdownItem color='destructive' dataTest='Remove' label='Remove' onClick={onRemoveClick} />);
  }

  return (
    <SelectField
      dataTest={dataTest}
      disabled={disabled}
      forceTheme={theme}
      onChange={(newLevel) => {
        setSelectedPermission(newLevel as PermissionLevel);
      }}
      size={size}
      value={selectedPermission}
    >
      {permissionItems}
    </SelectField>
  );
};

export default AccessLevelSelect;
