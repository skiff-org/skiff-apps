import { Divider, Icon } from '@skiff-org/skiff-ui';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { AddressObject, useUserLabelsQuery } from '../../generated/graphql';
import useCustomSnackbar from '../../hooks/useCustomSnackbar';
import { useDrafts } from '../../hooks/useDrafts';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { RootState } from '../../redux/store/reduxStore';
import { SYSTEM_LABELS, userLabelFromGraphQL } from '../../utils/label';
import OrganizationalSelect from '../OrganizationalSelect/OrganizationalSelect';
import { ComposeSidebarItem, LabelSidebarItem, FeedbackSidebarItem, SearchSidebarItem, SettingsSidebarItem } from './SidebarItem';

const LabelList = styled.div`
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  overflow: auto;
`;

const BottomContainer = styled.div`
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  flex-grow: 0;
  justify-content: flex-end;
`;

const Container = styled.div`
  height: 100%;
  width: 240px;
  border-right: 1px solid var(--border-secondary);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
`;

// Search, Settings, Etc
const ButtonLabelList = styled(LabelList)`
  flex: inherit;
`;

export const Sidebar: React.FC = () => {
  const { data } = useUserLabelsQuery();
  const userLabels = data?.userLabels?.map(userLabelFromGraphQL) ?? [];
  const user = useRequiredCurrentUserData();
  const { composeNewDraft } = useDrafts();

  // Redux selectors and actions
  const { composeOpen, isComposeCollapsed } = useSelector((state: RootState) => state.modal);
  const dispatch = useDispatch();
  const openCommandPalette = () =>
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
  const expand = () => dispatch(skemailModalReducer.actions.expand());

  const { enqueueCustomSnackbar } = useCustomSnackbar();

  const openCompose = () => {
    if (composeOpen) {
      if (isComposeCollapsed) {
        expand();
      } else {
        enqueueCustomSnackbar({
          body: 'You are already composing a message',
          icon: Icon.Warning,
          position: {
            vertical: 'top',
            horizontal: 'center'
          }
        });
      }
      return;
    }
    dispatch(skemailModalReducer.actions.openCompose({}));
    composeNewDraft();
  };

  const closeCompose = () => dispatch(skemailModalReducer.actions.closeCompose());

  const supportAddress: AddressObject = {
    address: 'support@skiff.org',
    name: 'Skiff Support'
  }

  const openFeedbackCompose = async () => {
    if (composeOpen) {
      await closeCompose();
      // save existing as draft and open new compose modal
    }
    dispatch(skemailModalReducer.actions.openCompose({
      populateComposeToAddresses: [supportAddress],
      populateComposeSubject: 'Feedback'
    }));
    composeNewDraft();
  };

  return (
    <Container>
      <OrganizationalSelect user={user} />
      <ButtonLabelList>
        {/* Compose */}
        <ComposeSidebarItem onClick={openCompose} />
        {/* Search */}
        <SearchSidebarItem onClick={openCommandPalette} />
        {/* Settings */}
        <SettingsSidebarItem />
      </ButtonLabelList>
      <Divider length='long' />
      <LabelList>
        {/* System Labels */}
        {SYSTEM_LABELS.map((label) => (
          <LabelSidebarItem key={label.value} label={label} type='system' />
        ))}
        {/* User Labels */}
        {userLabels.map((label) => (
          <LabelSidebarItem key={label.value} label={label} type='user' />
        ))}
      </LabelList>
      <BottomContainer>
        <FeedbackSidebarItem onClick={openFeedbackCompose} />
      </BottomContainer>
    </Container>
  );
};
