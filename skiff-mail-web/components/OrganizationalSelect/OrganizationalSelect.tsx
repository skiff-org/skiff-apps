import { Divider, Icon, Icons, Surface, Typography } from '@skiff-org/skiff-ui';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import Portal from '../../../skiff-ui/src/components/Portal/Portal';
import {
  GetOrganizationsQuery,
  useGetCurrentUserEmailAliasesQuery,
  useGetOrganizationsQuery
} from '../../generated/graphql';
import { User } from '../../models/user';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { storeRedirectInLocalStorage } from '../../utils/crypto/v1/lib/storageUtils';
import { getEditorBasePath } from '../../utils/linkToEditorUtils';
import OrgSelectAction from './OrgSelectAction';
import OrgSelectWorkspace from './OrgSelectWorkspace';

const SelectContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;

  &:hover {
    background: var(--bg-cell-hover);
  }
`;

const DropdownContainer = styled.div`
  position: absolute;
  z-index: 999;
  width: 295px;
  top: 14px;
  left: 254px;
`;

const OrgSelectActions = styled.div`
  padding: 12px 18px 4px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-sizing: border-box;
`;

const OrganizationsList = styled.div`
  max-height: 180px;
  overflow: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  color: transparent;
  width: 100%;
`;

const DisplayNameContainer = styled.div`
  width: 90%;
  max-width: 90%;
`;

interface OrgSelectProps {
  user: User;
}

const OrganizationalSelect: React.FC<OrgSelectProps> = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useDispatch();
  const openLogoutModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Logout }));
  };

  const { data, loading } = useGetOrganizationsQuery();
  const organizations = data?.organizations ?? [];

  // Handle outside clicks
  const wrapperRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const dropdownRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const handleClickOutside = (evt: MouseEvent) => {
    if (wrapperRef.current || dropdownRef.current) {
      const insideClick =
        wrapperRef.current?.contains(evt.target as Node) || dropdownRef.current?.contains(evt.target as Node);
      if (!insideClick) {
        setIsDropdownOpen(false);
      }
    }
  };
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const { data: emailAliasQuery } = useGetCurrentUserEmailAliasesQuery();
  const emailAliases = emailAliasQuery?.currentUser?.emailAliases ?? [];

  const handleOrgSelect = (org?: GetOrganizationsQuery['organizations'][number]) => {
    const everyoneTeamRootDocID = org?.everyoneTeam.rootDocument?.docID;

    storeRedirectInLocalStorage(everyoneTeamRootDocID);
    if (org && everyoneTeamRootDocID) {
      window.location.replace(`${getEditorBasePath()}/folder/${everyoneTeamRootDocID}`);
    } else {
      window.location.replace(`${getEditorBasePath()}/dashboard`);
    }
  };

  return (
    <>
      <SelectContainer
        onClick={(evt: React.MouseEvent) => {
          setIsDropdownOpen((curIsOpen) => !curIsOpen);
          evt.stopPropagation();
        }}
        ref={selectRef}
      >
        <DisplayNameContainer>
          <Typography level={2} type='label'>
            {user.publicData?.displayName || 'Skiff Mail'}
          </Typography>
          {!!emailAliases?.length && (
            <Typography color='secondary' level={3} type='label'>
              {emailAliases[0]}
            </Typography>
          )}
        </DisplayNameContainer>
        <Icons color='secondary' icon={Icon.ChevronRight} />
      </SelectContainer>
      {isDropdownOpen && !loading && (
        <Portal>
          <DropdownContainer ref={wrapperRef}>
            <Surface level='l2' open={isDropdownOpen} optionMenu ref={dropdownRef} size='full-width'>
              <OrganizationsList>
                <OrgSelectWorkspace
                  active
                  color='blue'
                  icon={Icon.Envelope}
                  // if user has set up a Skiff Mail account, show their
                  // primary address. if not, display a generic 'Skiff Mail' button
                  label={emailAliases?.length ? emailAliases[0] : 'Skiff Mail'}
                  subLabel={emailAliases?.length ? 'Skiff Mail' : 'Open inbox'}
                />
                <OrgSelectWorkspace
                  icon={Icon.User}
                  label={user.publicData?.displayName || user.username}
                  onClick={() => {
                    storeRedirectInLocalStorage(undefined);
                    window.location.replace(getEditorBasePath());
                  }}
                  subLabel='Personal'
                />
                {organizations.map((org) => (
                  <OrgSelectWorkspace
                    key={org.name}
                    label={org.name}
                    onClick={() => {
                      handleOrgSelect(org);
                    }}
                    subLabel='Workspace'
                  />
                ))}
              </OrganizationsList>
              <Divider length='long' style={{ marginTop: '4px' }} />
              <OrgSelectActions>
                <OrgSelectAction dataTest='Logout' icon={Icon.Exit} label={'Logout'} onClick={openLogoutModal} />
              </OrgSelectActions>
            </Surface>
          </DropdownContainer>
        </Portal>
      )}
    </>
  );
};

export default OrganizationalSelect;
