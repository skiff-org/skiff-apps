import { Button, Icon, IconButton } from 'nightwatch-ui';
import styled from 'styled-components';

import useScheduleSend from '../ScheduleSend/useScheduleSend';

const DeleteButtonContainer = styled.div`
  margin-left: auto;
`;

interface ComposeActionsArgs {
  handleSendClick: (scheduleSendAt?: Date) => Promise<void>;
  toggleLink: () => void;
  insertImage: () => void;
  discardDraft: () => Promise<void>;
  isLinkEnabled: () => boolean | null;
  messageSizeExceeded: boolean;
  openAttachmentSelect: () => void;
}

/**
 * Creates all Buttons for Desktop Bottom Bar and for Mobile Action bar
 * since they have similar functionality. Buttons with same functionality will be shared
 * the rest are created separately
 */
export default function useComposeActions({
  handleSendClick,
  toggleLink,
  insertImage,
  discardDraft,
  isLinkEnabled,
  messageSizeExceeded,
  openAttachmentSelect
}: ComposeActionsArgs) {
  const { ScheduleSendButton, ScheduleSendDrawer } = useScheduleSend(handleSendClick);

  const desktopDeleteButton = (
    <DeleteButtonContainer key='desktop-delete-button'>
      <IconButton color='destructive' icon={Icon.Trash} onClick={() => void discardDraft()} tooltip='Discard draft' />
    </DeleteButtonContainer>
  );

  const desktopSendButton = (
    <Button
      dataTest='send-button'
      disabled={messageSizeExceeded}
      key='desktop-send-button'
      onClick={() => void handleSendClick()}
      tooltip={messageSizeExceeded ? 'Attachments are too large!' : undefined}
    >
      Send
    </Button>
  );

  // Shared Buttons
  const imageButton = (
    <IconButton
      dataTest='insert-image'
      icon={Icon.Image}
      key='image-compose-button'
      onClick={insertImage}
      tooltip='Insert image'
    />
  );

  const linkButton = (
    <IconButton
      disabled={!isLinkEnabled()}
      icon={Icon.Link}
      key='link-compose-button'
      onClick={toggleLink}
      tooltip='Insert link'
    />
  );

  const attachmentsButton = (
    <IconButton
      icon={Icon.PaperClip}
      key='attachments-compose-button'
      onClick={openAttachmentSelect}
      tooltip='Add attachments'
    />
  );

  const desktopBottomBarButtons = [
    desktopSendButton,
    ScheduleSendButton,
    imageButton,
    linkButton,
    attachmentsButton,
    desktopDeleteButton
  ];

  const mobileActionBarButtons = [ScheduleSendButton, attachmentsButton, linkButton, imageButton];

  return { desktopBottomBarButtons, mobileActionBarButtons, ScheduleSendDrawer };
}
