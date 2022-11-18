import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { DEFAULT_WORKSPACE_EVENT_VERSION, InviteUsersModal, useToast } from 'skiff-front-utils';
import { RequestStatus, WorkspaceEventType } from 'skiff-graphql';
import {
  ReferUserDocument,
  ReferUserMutation,
  ReferUserMutationVariables,
  useGetUserContactListQuery
} from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import { EmailType } from 'skiff-utils';

import client from '../../apollo/client';
import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { EditorAppRoutes, PROD_BASE_URL, QueryParam } from '../../constants/route.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDisplayPictureDataFromAddress } from '../../hooks/useDisplayPictureDataFromAddress';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { isSkiffAddress, storeWorkspaceEvent } from '../../utils/userUtils';

export const InviteUsersMailModal = () => {
  const { openModal } = useAppSelector((state) => state.modal);
  const { enqueueToast } = useToast();

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };
  const isOpen = openModal?.type === ModalType.InviteUsers;

  const { userID, username } = useRequiredCurrentUserData();
  const { data } = useGetUserContactListQuery({
    variables: {
      request: {
        userID
      }
    },
    pollInterval: POLL_INTERVAL_IN_MS
  });

  // contact list that does not include skiff users
  const contactsList = useMemo(() => {
    const allContacts = data?.user?.contactList || [];
    const nonSkiffContacts = allContacts.filter(({ address }) => !isSkiffAddress(address, []));
    return nonSkiffContacts;
  }, [data]);

  const referralLink = `${PROD_BASE_URL}${EditorAppRoutes.SIGNUP}?${QueryParam.MAIL}&${
    QueryParam.REFERRAL
  }=${encodeURIComponent(username)}`;

  const sendReferralLink = async (email: string) => {
    const referralTemplate = EmailType.REFER_EMAIL;
    const response = await client.mutate<ReferUserMutation, ReferUserMutationVariables>({
      mutation: ReferUserDocument,
      variables: {
        request: {
          email,
          referralTemplate
        }
      }
    });

    const status = response.data?.referUser.status;
    if (status === RequestStatus.Success) {
      void storeWorkspaceEvent(WorkspaceEventType.DashboardInviteSent, '', DEFAULT_WORKSPACE_EVENT_VERSION);
      enqueueToast({
        body: `Invite sent to ${email}`,
        icon: Icon.Check
      });
    } else {
      enqueueToast({
        body: `Failed to send invite to ${email}, please try again later`,
        icon: Icon.Warning
      });
    }
  };

  return (
    <InviteUsersModal
      contactsList={contactsList}
      isOpen={isOpen}
      onClose={onClose}
      referralLink={referralLink}
      sendReferralLink={sendReferralLink}
      useDisplayPictureDataFromAddress={useDisplayPictureDataFromAddress}
    />
  );
};
