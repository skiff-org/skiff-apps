import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  ReferUserDocument,
  ReferUserMutation,
  ReferUserMutationVariables,
  useGetAllCurrentUserContactsQuery
} from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  InviteUsersModal,
  useToast,
  useRequiredCurrentUserData,
  contactToAddressObject,
  useDefaultEmailAlias
} from 'skiff-front-utils';
import { RequestStatus, WorkspaceEventType } from 'skiff-graphql';
import { EmailType, isSkiffAddress } from 'skiff-utils';

import client from '../../apollo/client';
import { EditorAppRoutes, PROD_BASE_URL, QueryParam } from '../../constants/route.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDisplayPictureDataFromAddress } from '../../hooks/useDisplayPictureDataFromAddress';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../utils/userUtils';

export const InviteUsersMailModal = () => {
  const { openModal } = useAppSelector((state) => state.modal);
  const { enqueueToast } = useToast();

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };
  const isOpen = openModal?.type === ModalType.InviteUsers;

  const { userID, username } = useRequiredCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);

  const { data: contactsData } = useGetAllCurrentUserContactsQuery({
    fetchPolicy: 'cache-first',
    onError: (error) => {
      console.error(`Failed to retrieve User's contact list`, JSON.stringify(error, null, 2));
    }
  });

  const contactList = contactsData?.allContacts?.map(contactToAddressObject) ?? [];

  // contact list that does not include skiff users
  const contactListWithoutSkiffUsers = useMemo(() => {
    const nonSkiffContacts = contactList.filter(({ address }) => !isSkiffAddress(address, []));
    return nonSkiffContacts;
    // Use length rather than array to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactList.length]);

  const referralLink = `${PROD_BASE_URL}${EditorAppRoutes.SIGNUP}?${QueryParam.MAIL}&${
    QueryParam.REFERRAL
  }=${encodeURIComponent(defaultEmailAlias ?? username)}`;

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
        title: `Invite sent`,
        body: `${email} invited to Skiff.`
      });
    } else {
      enqueueToast({
        title: 'Failed to send invite',
        body: `Invite not sent to ${email}, please try again later`
      });
    }
  };

  return (
    <InviteUsersModal
      contactsList={contactListWithoutSkiffUsers}
      isOpen={isOpen}
      onClose={onClose}
      referralLink={referralLink}
      sendReferralLink={sendReferralLink}
      useDisplayPictureDataFromAddress={useDisplayPictureDataFromAddress}
    />
  );
};

export default InviteUsersMailModal;
