import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  ButtonGroup,
  ButtonGroupItem,
  FilledVariant,
  Icon,
  IconButton,
  Icons,
  InputField,
  Layout,
  ThemeMode,
  Type,
  Typography,
  getThemedColor
} from 'nightwatch-ui';
import { FC, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { PermissionLevel } from 'skiff-graphql';
import { PaywallErrorCode, isPaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { useShareDocument, useToast } from '../../../hooks';
import { ShareDocWithUsersRequest } from '../../../utils';
import { UserAvatar } from '../../UserAvatar';

const InviteeList = styled.div<{ $forceTheme?: ThemeMode }>`
  width: 100%;
  max-height: 42vh;

  // Use scroll instead of auto to keep same behavior with :not(:hover) below
  // whether element is overflowing or not
  overflow-y: scroll;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  box-sizing: border-box;
  padding: 12px;
  border: 1px solid
    ${(props) =>
      !!props.$forceTheme ? getThemedColor('var(--border-tertiary)', props.$forceTheme) : 'var(--border-tertiary)'};
  border-radius: 12px;
`;

const InviteeRow = styled.div`
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AvatarAndEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Footer = styled.div<{ $displayingEmailsList: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;

  margin-top: ${(props) => (props.$displayingEmailsList ? 20 : 4)}px;
`;

const StyledInputFieldContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const StyledAddInviteButton = styled.div``;

interface InviteByEmailProps {
  client: ApolloClient<NormalizedCacheObject>;
  everyoneTeamDocID: string;
  onCancel: () => void;
  onClose: () => void;
  setPaywallErrorCode: (paywallErrorCode: PaywallErrorCode) => void;
  workspaceName?: string;
}

const InviteByEmail: FC<InviteByEmailProps> = ({
  client,
  everyoneTeamDocID,
  onCancel,
  onClose,
  setPaywallErrorCode,
  workspaceName
}) => {
  const [isSendingInvites, setIsSendingInvite] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);
  const { shareUsers, validateEntry } = useShareDocument(client, everyoneTeamDocID);
  const { enqueueToast } = useToast();

  const [inputError, setInputError] = useState<string>('');

  const inviteUsers = async () => {
    if (!emailsToInvite.length && !inputValue) return;

    setIsSendingInvite(true);
    addInputValueToEmailsList();

    if (!!inputError) {
      return;
    }

    const shareRequests: ShareDocWithUsersRequest[] = emailsToInvite.map((email) => ({
      userEmailOrID: email,
      permissionLevel: PermissionLevel.Editor
    }));

    const inviteError = (await shareUsers(shareRequests))?.error;
    if (inviteError) {
      if (isPaywallErrorCode(inviteError)) {
        setPaywallErrorCode(inviteError as PaywallErrorCode);
      } else {
        setInputError(inviteError);
      }
      setIsSendingInvite(false);
      return;
    }

    const userText = `User${emailsToInvite.length > 1 ? 's' : ''}`;
    enqueueToast({
      title: `${userText} invited`,
      body: `${emailsToInvite.length} ${userText} invited${!!workspaceName ? ` to ${workspaceName}` : ''}`
    });
    setEmailsToInvite([]);
    setIsSendingInvite(false);
    setInputError('');
    setEmailsToInvite([]);
    setInputValue('');
    onClose();
  };

  // Return false if validation error
  const addInputValueToEmailsList = (): void => {
    if (!inputValue) return;

    const { error: validationError } = validateEntry(inputValue);

    if (validationError) {
      setInputError(validationError);
    } else {
      // only add unique entries
      setEmailsToInvite((prev) => [...new Set([...prev, inputValue])]);
      setInputValue('');
    }
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void addInputValueToEmailsList();
  };

  return (
    <>
      <StyledInputFieldContainer>
        <InputField
          autoFocus
          error={inputError}
          forceTheme={isMobile ? ThemeMode.DARK : undefined}
          onBlur={addInputValueToEmailsList}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInputError('');
            setInputValue(e.target.value);
          }}
          onKeyDown={submitOnEnter}
          placeholder='Add email'
          value={inputValue}
        />
        <StyledAddInviteButton>
          <IconButton
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            icon={Icon.Plus}
            onClick={addInputValueToEmailsList}
            type={Type.SECONDARY}
          />
        </StyledAddInviteButton>
      </StyledInputFieldContainer>
      {!!emailsToInvite.length && (
        <InviteeList $forceTheme={isMobile ? ThemeMode.DARK : undefined}>
          {emailsToInvite.map((email) => (
            <InviteeRow key={`${email}-pending-workspace-invite`}>
              <AvatarAndEmail>
                <UserAvatar forceTheme={isMobile ? ThemeMode.DARK : undefined} label={email} />
                <Typography forceTheme={isMobile ? ThemeMode.DARK : undefined}>{email}</Typography>
              </AvatarAndEmail>
              <IconButton
                forceTheme={isMobile ? ThemeMode.DARK : undefined}
                icon={<Icons color='disabled' icon={Icon.Close} />}
                onClick={() => setEmailsToInvite((prev) => prev.filter((emailToInvite) => emailToInvite !== email))}
                variant={FilledVariant.UNFILLED}
              />
            </InviteeRow>
          ))}
        </InviteeList>
      )}
      <Footer $displayingEmailsList={!!emailsToInvite.length}>
        <ButtonGroup
          forceTheme={isMobile ? ThemeMode.DARK : undefined}
          fullWidth={isMobile}
          layout={isMobile ? Layout.STACKED : Layout.INLINE}
        >
          <ButtonGroupItem label='Invite' loading={isSendingInvites} onClick={() => void inviteUsers()} />
          <ButtonGroupItem label='Back' onClick={onCancel} />
        </ButtonGroup>
      </Footer>
    </>
  );
};

export default InviteByEmail;
