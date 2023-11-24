import {
  ButtonGroup,
  ButtonGroupItem,
  Icon,
  Dialog,
  MonoTag,
  Size,
  Type,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import { useState } from 'react';
import { useStoreWorkspaceEventMutation, useGetOrCreateStripeCustomerQuery } from 'skiff-front-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import { getPremiumUsernamePrice, getPremiumUsernameSuggestions } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../constants';
import { useToast } from '../../hooks';
import { MAIL_DOMAIN } from '../../utils';
import { UserAvatar } from '../UserAvatar';

const CurrentUsernameRow = styled.div`
  display: flex;
  padding: 12px 16px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  box-sizing: border-box;

  border-radius: 8px;
  border: 1px var(--border-primary) solid;
  border-bottom-width: 2px;
`;

const AvatarAndUsername = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SimilarUsernamesContainer = styled.div`
  display: flex;
  padding: 6px;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;

  border-radius: 8px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-overlay-quaternary);
`;

const SimilarUsernameRow = styled.div`
  display: flex;
  padding: 12px 8px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  border-radius: 8px;

  &:hover {
    background: var(--overlay-overlay-tertiary, rgba(0, 0, 0, 0.04));
    cursor: pointer;
  }
`;

interface SimilarUsernameProps {
  username: string;
  similarUsername: string;
  setUsername: (username: string) => void;
}

function SimilarUsernameOption({ similarUsername, setUsername, username }: SimilarUsernameProps) {
  const [isHovering, setIsHovering] = useState(false);
  const userData = useRequiredCurrentUserData();

  return (
    <SimilarUsernameRow
      key={`premium-username-${similarUsername}`}
      onClick={() => setUsername(similarUsername)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <AvatarAndUsername>
        <UserAvatar
          badgeIcon={Icon.Star}
          displayPictureData={userData.publicData?.displayPictureData}
          label={username}
          size={Size.LARGE}
        />
        <Typography>
          {similarUsername}@{MAIL_DOMAIN}
        </Typography>
      </AvatarAndUsername>
      {isHovering ? (
        <Typography color='secondary' mono size={TypographySize.SMALL}>
          SELECT
        </Typography>
      ) : (
        <MonoTag color='secondary' label={`$${getPremiumUsernamePrice(similarUsername)}/MONTH`} />
      )}
    </SimilarUsernameRow>
  );
}

interface PremiumUsernameModalProps {
  open: boolean;
  onClose: () => void;
  setUsername: (username: string) => void;
  username: string;
}

function PremiumUsernameModal({ open, onClose, setUsername, username }: PremiumUsernameModalProps) {
  const userData = useRequiredCurrentUserData();
  const similarUsernames = getPremiumUsernameSuggestions(username, 2);
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const { data: stripeCustomerQuery } = useGetOrCreateStripeCustomerQuery();
  const { enqueueToast } = useToast();

  const onRequest = () => {
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.RequestedPremiumUsername,
          data: JSON.stringify({
            requestedUsername: username,
            stripeCustomerID: stripeCustomerQuery?.getOrCreateStripeCustomer.stripeCustomerID
          }),
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });

    enqueueToast({
      title: 'Premium username requested',
      body: "We'll let you know if you're eligible soon."
    });
    onClose();
  };

  return (
    <Dialog
      customContent
      description={`Skiff will always remain a free service. These aliases are reserved for our most dedicated members.`}
      onClose={onClose}
      open={open}
      title="You've chosen a premium username"
    >
      <CurrentUsernameRow>
        <AvatarAndUsername>
          <UserAvatar
            badgeColor='orange'
            badgeIcon={Icon.Star}
            badgeSize={12}
            badgeTooltip='The Skiff Premium badge comes included with this purchase'
            displayPictureData={userData.publicData?.displayPictureData}
            label={username}
            showBadge
            size={Size.LARGE}
          />
          <Typography>
            {username}@{MAIL_DOMAIN}
          </Typography>
        </AvatarAndUsername>
        <MonoTag color='secondary' label={`$${getPremiumUsernamePrice(username)}/MONTH`} />
      </CurrentUsernameRow>
      {!!similarUsernames?.length && (
        <>
          <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase>
            Similar Usernames
          </Typography>
          <SimilarUsernamesContainer>
            {similarUsernames.map((similarUsername) => (
              <SimilarUsernameOption
                key={`similar-username-${similarUsername}`}
                setUsername={setUsername}
                similarUsername={similarUsername}
                username={username}
              />
            ))}
          </SimilarUsernamesContainer>
        </>
      )}
      <ButtonGroup>
        <ButtonGroupItem key='request' label='Request' onClick={onRequest} type={Type.PRIMARY} />
        <ButtonGroupItem key='back' label='Back' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
}

export default PremiumUsernameModal;
