import { debounce } from 'lodash';
import {
  Button,
  CircularProgress,
  FilledVariant,
  Icon,
  IconText,
  InputComponent,
  Size,
  Toggle,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDropzone } from 'react-dropzone';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import {
  GetContactAutoSyncSettingsDocument,
  useCreateOrUpdateContactMutation,
  useGetAllCurrentUserContactsQuery,
  useGetContactAutoSyncSettingsQuery,
  useSetContactAutosyncSettingMutation
} from 'skiff-front-graphql';
import styled, { css } from 'styled-components';

import { MB_SCALE_FACTOR } from '../../../../../skiff-utils/src';
import { useRequiredCurrentUserData } from '../../../apollo';
import { useToast, useWarnBeforeUnloading } from '../../../hooks';
import Checkbox from '../../Checkbox/Checkbox';
import EncryptionBadge, { EncryptionBadgeTypes } from '../../EncryptionBadge';
import ContactsImport from '../Contacts/ContactsImport';
import { AvatarNameContainer, UserIconContainer } from '../shared/UserListRow';

import { handleContactImport } from './ContactsImport.utils';

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  ${isMobile &&
  css`
    background: var(--bg-overlay-quaternary);
    border-radius: 20px;
  `}
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
`;

const SearchButton = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const NumberLabel = styled.span`
  color: var(--text-disabled);
`;

const NoMembersText = styled.div`
  padding-top: 8px;
`;

const Container = styled.div<{ $showContactProfileView: boolean; $isDragActive: boolean }>`
  display: flex;
  flex-direction: column;
  background: ${({ $isDragActive }) =>
    $isDragActive ? 'var(--bg-overlay-tertiary)' : isMobile ? '' : 'var(--bg-l1-solid)'};
  width: ${({ $showContactProfileView }) => ($showContactProfileView ? '50%' : '100%')};
  min-width: ${({ $showContactProfileView }) => ($showContactProfileView ? '50%' : '100%')};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-direction: row;
`;

const Header = styled.div`
  display: flex;
  padding: ${isMobile ? '0px' : '16px'};
  box-sizing: border-box;
  flex-direction: column;
  gap: 16px;
`;

const Separator = styled.div`
  height: 20px;
  width: 1px;
  background: var(--border-secondary);
`;

const AutoSyncSection = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  box-sizing: border-box;
`;

const UserListRowHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px 16px;
  border-bottom: 1px solid var(--border-tertiary);
`;

export interface ContactUserListTableSection {
  columnHeaders: string[];
  rows: React.ReactNode[];
  emptyText?: string;
}

interface ContactUserListTableProps {
  sections: ContactUserListTableSection[];
  header: string;
  inputField: InputComponent;
  isBulkDeleting: boolean;
  isSelectingContacts: boolean;
  isAllContactsSelected: boolean;
  showContactProfileView: boolean;
  addButtonLabel: string;
  openDeleteContactsConfirmation: () => void;
  onAddButtonClick: () => void;
  onClearAllSelectedContacts: () => void;
  onSelectAllContacts: () => void;
  headerNumber?: number;
  addButtonDataTest?: string;
  loading?: boolean;
}

// Row renderer extracted as a memoized component
const RowRenderer = React.memo(({ index, style, data }: ListChildComponentProps) => {
  const rows = data as React.ReactNode[];
  return <div style={style}>{rows[index]}</div>;
});

const getRowHeight = () => {
  return 61;
};

const MAX_CONTACT_IMPORT_SIZE = 100 * MB_SCALE_FACTOR;

const ContactUserListTable: React.FC<ContactUserListTableProps> = ({
  sections,
  header,
  headerNumber,
  inputField,
  addButtonLabel,
  showContactProfileView,
  openDeleteContactsConfirmation,
  onAddButtonClick,
  onClearAllSelectedContacts,
  onSelectAllContacts,
  addButtonDataTest,
  isBulkDeleting,
  isSelectingContacts,
  isAllContactsSelected,
  loading
}) => {
  const { enqueueToast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [createOrUpdateContact] = useCreateOrUpdateContactMutation();

  // Graphql
  const { refetch } = useGetAllCurrentUserContactsQuery({
    onError: (err) => {
      console.error('Failed to load contacts', err);
    }
  });
  const userData = useRequiredCurrentUserData();

  const debouncedRefresh = debounce(
    () => {
      void refetch();
    },
    2000,
    {
      maxWait: 5000 // refetch every 5s max
    }
  );

  useWarnBeforeUnloading(isImporting);

  const onFilesRejected = () => {
    enqueueToast({ title: 'Failed to import contacts' });
  };

  const { isDragActive, getRootProps: getDropzoneRootProps } = useDropzone({
    onDropAccepted: (newFiles: Array<File>) =>
      handleContactImport(newFiles, setIsImporting, enqueueToast, userData, createOrUpdateContact, debouncedRefresh),
    onDropRejected: onFilesRejected,
    maxSize: MAX_CONTACT_IMPORT_SIZE,
    accept: '.vcf, .csv',
    noKeyboard: true
  });

  const [listHeight, setListHeight] = useState(() => calculateListHeight());

  useEffect(() => {
    const handleResize = () => {
      setListHeight(calculateListHeight());
    };
    window.addEventListener('resize', handleResize);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  function calculateListHeight() {
    return window.innerHeight * 0.7 - 162;
  }

  // Graphql
  const { data, loading: autoSyncLoading } = useGetContactAutoSyncSettingsQuery();

  const currentAutoSyncContactsSetting = data?.currentUser?.autoSyncContactsSetting ?? false;

  const [setContactAutoSyncSettings] = useSetContactAutosyncSettingMutation({
    onError: (err) => {
      console.error(err);
      enqueueToast({ title: 'Failed to set auto sync contacts setting' });
    }
  });

  const updateContactAutosyncSetting = useCallback(
    () =>
      setContactAutoSyncSettings({
        variables: {
          request: !currentAutoSyncContactsSetting
        },
        refetchQueries: [{ query: GetContactAutoSyncSettingsDocument }]
      }),
    [setContactAutoSyncSettings, currentAutoSyncContactsSetting]
  );
  const toggleAutoSync = () => void updateContactAutosyncSetting();

  const onClickSelectContacts = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.stopPropagation();
    if (isSelectingContacts) {
      onClearAllSelectedContacts();
    } else {
      onSelectAllContacts();
    }
  };

  return (
    <Container
      {...getDropzoneRootProps()}
      $isDragActive={isDragActive}
      $showContactProfileView={showContactProfileView}
    >
      <Header>
        <SearchButton>
          {!isMobile && (
            <Typography size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
              {header} {!!headerNumber && <NumberLabel>{headerNumber}</NumberLabel>}
            </Typography>
          )}
          <ButtonContainer>
            {!isMobile && (
              <>
                <EncryptionBadge type={EncryptionBadgeTypes.E2EE} />
                <Separator />
              </>
            )}
            {!isMobile && (
              <>
                <ContactsImport />
                <IconText
                  dataTest={addButtonDataTest}
                  onClick={onAddButtonClick}
                  startIcon={Icon.Plus}
                  tooltip={addButtonLabel}
                  variant={FilledVariant.FILLED}
                />
              </>
            )}
            {isMobile && (
              <Button
                dataTest={addButtonDataTest}
                fullWidth
                icon={Icon.Plus}
                onClick={onAddButtonClick}
                tooltip={addButtonLabel}
                type={Type.SECONDARY}
              >
                Add contact
              </Button>
            )}
          </ButtonContainer>
        </SearchButton>
        {inputField}
        {!isMobile && (
          <AutoSyncSection>
            <Typography color='disabled' size={TypographySize.SMALL}>
              Auto-save email recipients to contacts
            </Typography>
            <Toggle
              checked={currentAutoSyncContactsSetting}
              disabled={autoSyncLoading}
              onChange={toggleAutoSync}
              size={Size.SMALL}
            />
          </AutoSyncSection>
        )}
      </Header>
      {!isMobile && (
        <UserListRowHeader>
          <AvatarNameContainer>
            <UserIconContainer isPointerCursor onClick={onClickSelectContacts}>
              <Checkbox
                checked={isSelectingContacts}
                indeterminate={isSelectingContacts && !isAllContactsSelected}
                onClick={onClickSelectContacts}
              />
            </UserIconContainer>
            <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL}>
              Name
            </Typography>
          </AvatarNameContainer>
          {isSelectingContacts &&
            (isBulkDeleting ? (
              <CircularProgress size={Size.SMALL} spinner />
            ) : (
              <IconText
                color={Type.DESTRUCTIVE}
                onClick={() => {
                  openDeleteContactsConfirmation();
                }}
                startIcon={Icon.Trash}
              />
            ))}
        </UserListRowHeader>
      )}
      {sections.map(({ columnHeaders, rows, emptyText }) => (
        <ListContainer key={columnHeaders.join(',')}>
          {!loading && (
            <>
              <VariableSizeList
                height={listHeight}
                itemCount={rows.length}
                itemData={rows}
                itemSize={getRowHeight}
                width='100%'
              >
                {RowRenderer}
              </VariableSizeList>
              {!rows.length && !!emptyText && (
                <EmptyContainer>
                  <Typography color='disabled'>
                    <NoMembersText>{emptyText}</NoMembersText>
                  </Typography>
                </EmptyContainer>
              )}
            </>
          )}
          {loading && (
            <LoadingContainer>
              <CircularProgress spinner />
            </LoadingContainer>
          )}
        </ListContainer>
      ))}
    </Container>
  );
};

export default ContactUserListTable;
