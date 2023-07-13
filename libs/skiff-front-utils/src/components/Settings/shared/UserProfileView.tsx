import isArray from 'lodash/isArray';
import {
  ButtonComponent,
  ButtonGroup,
  ButtonGroupProps,
  Color,
  Icon,
  IconText,
  InputField,
  Size,
  Typography,
  TypographySize
} from '@skiff-org/skiff-ui';
import React, { ReactNode } from 'react';
import { isMobile } from 'react-device-detect';
import { CreateUploadAvatarLinkResponse, DisplayPictureData } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import EditProfile from '../../EditProfile';

const ROW_MIN_HEIGHT = 62;
const ROW_VERTICAL_PADDING = 12;

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SelectContainer = styled.div`
  position: relative;
  margin-bottom: -20px;
`;

const SelectAbsolute = styled.div`
  position: absolute;
  top: -40px;
  right: 0;
`;

const ListHeader = styled.div`
  margin-top: 20px;
  display: flex;
  width: 100%;
  min-width: 30%;
  padding: 4px 12px 4px 8px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-tertiary);
  align-items: center;
  justify-content: left;
`;

const InfoTableRow = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  box-sizing: border-box;
`;

const ColumnValue = styled.div<{ $canSetEditing: boolean }>`
  display: flex;
  align-items: center;

  min-width: 30%;
  box-sizing: border-box;
  min-height: ${ROW_MIN_HEIGHT - ROW_VERTICAL_PADDING * 2}px;

  ${(props) =>
    props.$canSetEditing
      ? css`
          cursor: text;
        `
      : ''}
`;

const Actions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

const ListItem = styled.div<{ $isLast: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  padding: ${ROW_VERTICAL_PADDING} 8px;
  min-height: ${ROW_MIN_HEIGHT}px;
  border-bottom: ${(props) => (!props.$isLast ? '1px solid var(--border-tertiary)' : '')};
`;

const Footer = styled.div`
  margin-top: auto;
`;

export interface UserProfileInfoColumn {
  value: string;
  key: string;
  color?: Color;
  autoFocus?: boolean;
  setValue?: (value: string) => void;
  onEnter?: () => void;
}

export interface UserProfileInfoRow {
  columns: UserProfileInfoColumn[];
  key: string;
  actions?: React.ReactNode;
}

interface UserProfileViewProps {
  displayPictureData: DisplayPictureData | undefined;
  userProfileInfoRows: UserProfileInfoRow[];
  // For different types of avatars (user, contact, org), we use a different upload mutation
  // We want this prop to be mandatory to ensure we always use the correct mutation
  createUploadLink: (() => Promise<CreateUploadAvatarLinkResponse | undefined>) | undefined;
  onBackClick: () => void;
  displayName?: string;
  subtitle?: string;
  columnHeaders?: string[];
  selectElement?: React.ReactElement;
  hideEditProfileSection?: boolean;
  hideDisplayName?: boolean;
  headerButtons?: ButtonComponent | ButtonGroupProps['children'];
  footerButtons?: ButtonComponent | ButtonGroupProps['children'];
  editModeProps?: { isEditing: boolean; setIsEditing: (isEditing: boolean) => void };
  setDisplayPictureData?: (displayPictureData: DisplayPictureData) => Promise<void> | void;
  children?: ReactNode;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
  displayName,
  displayPictureData,
  userProfileInfoRows,
  createUploadLink,
  onBackClick,
  subtitle,
  columnHeaders,
  selectElement,
  hideEditProfileSection,
  hideDisplayName,
  setDisplayPictureData,
  editModeProps,
  headerButtons,
  footerButtons,
  children
}) => {
  const { isEditing = false, setIsEditing = undefined } = editModeProps || {};

  return (
    <>
      <HeaderButtons>
        <IconText label='Back' onClick={onBackClick} size={Size.MEDIUM} startIcon={Icon.ChevronLeft} />
        {headerButtons && (
          <>
            {isArray(headerButtons) && <ButtonGroup>{headerButtons}</ButtonGroup>}
            {!isArray(headerButtons) && headerButtons}
          </>
        )}
      </HeaderButtons>
      {!hideEditProfileSection && (
        <EditProfile
          compact
          createUploadLink={createUploadLink}
          displayName={displayName}
          displayPictureData={displayPictureData}
          hideDisplayName={hideDisplayName}
          setDisplayPictureData={setDisplayPictureData}
          sublabel={isMobile ? undefined : subtitle}
          type='inline'
        />
      )}
      {selectElement && (
        <SelectContainer>
          <SelectAbsolute>{selectElement}</SelectAbsolute>
        </SelectContainer>
      )}
      {children}
      <div>
        {!!columnHeaders?.length && (
          <ListHeader>
            {columnHeaders.map((columnHeader) => (
              <ColumnValue $canSetEditing={false} key={`${columnHeader}-header`}>
                <Typography color='disabled' key={`column-header-${columnHeader}`} mono size={TypographySize.CAPTION}>
                  {columnHeader}
                </Typography>
              </ColumnValue>
            ))}
          </ListHeader>
        )}
        {userProfileInfoRows.map(({ columns, key: rowKey, actions }, index) => {
          return (
            <ListItem $isLast={index === userProfileInfoRows.length - 1} key={`${rowKey}-user-profile-row`}>
              <InfoTableRow>
                {columns.map(({ value, key: colKey, color, autoFocus, setValue, onEnter }) => (
                  // Note: DO NOT REMOVE THE KEY ATTRIBUTE (or use a non-unique key), it will break input focus
                  <ColumnValue
                    $canSetEditing={!!setIsEditing}
                    key={`${colKey}-user-profile-column`}
                    onClick={!!setIsEditing ? () => setIsEditing(true) : undefined}
                  >
                    {(!isEditing || !setValue) && <Typography color={color}>{value}</Typography>}
                    {isEditing && setValue && (
                      <InputField
                        autoFocus={autoFocus}
                        ghost
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setValue(e.target.value);
                        }}
                        onKeyPress={(e: React.KeyboardEvent) => {
                          if (!!onEnter && e.key === 'Enter') {
                            onEnter();
                          }
                        }}
                        placeholder='Empty'
                        value={value}
                      />
                    )}
                  </ColumnValue>
                ))}
                {actions && <Actions>{actions}</Actions>}
              </InfoTableRow>
            </ListItem>
          );
        })}
      </div>
      {footerButtons && (
        <Footer>
          {isArray(footerButtons) && <ButtonGroup>{footerButtons}</ButtonGroup>}
          {!isArray(footerButtons) && footerButtons}
        </Footer>
      )}
    </>
  );
};

export default UserProfileView;
