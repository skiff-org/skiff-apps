import { Editor } from '@tiptap/react';
import { Button, FilledVariant, Icon, IconButton, Type } from '@skiff-org/skiff-ui';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { isLinkEnabled } from '../MailEditor/mailEditorUtils';
import useScheduleSend from '../ScheduleSend/useScheduleSend';

const DeleteButtonContainer = styled.div`
  margin-left: auto;
`;

interface ComposeActionsArgs {
  handleSendClick: (scheduleSendAt?: Date) => Promise<void>;
  toggleLink: () => void;
  insertImage: () => void;
  discardDraft: () => Promise<void>;
  messageSizeExceeded: boolean;
  openAttachmentSelect: () => void;
  editor: Editor | null;
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
  messageSizeExceeded,
  openAttachmentSelect,
  editor
}: ComposeActionsArgs) {
  const { ScheduleSendButton, ScheduleSendDrawer } = useScheduleSend(handleSendClick);
  const [linkActionEnable, setLinkActionEnable] = useState<boolean>(false);
  useEffect(() => {
    // Listen to selection change and update the linkActionEnable accordingly
    const onSelectionChange = () => {
      if (editor) {
        void setLinkActionEnable(isLinkEnabled(editor));
      }
    };
    if (editor) {
      editor.on('selectionUpdate', onSelectionChange);
    }
    return () => {
      if (editor) {
        editor.off('selectionUpdate', onSelectionChange);
      }
    };
  }, [editor]);
  const desktopDeleteButton = (
    <DeleteButtonContainer key='desktop-delete-button'>
      <div>
        <IconButton
          icon={Icon.Trash}
          onClick={() => void discardDraft()}
          tooltip='Discard draft'
          type={Type.DESTRUCTIVE}
          variant={FilledVariant.UNFILLED}
        />
      </div>
    </DeleteButtonContainer>
  );

  const desktopSendButton = (
    <div>
      <Button
        dataTest='send-button'
        disabled={messageSizeExceeded}
        key='desktop-send-button'
        onClick={() => void handleSendClick()}
      >
        Send
      </Button>
    </div>
  );

  // Shared Buttons
  const imageButton = (
    <div>
      <IconButton
        dataTest='insert-image'
        icon={Icon.Image}
        key='image-compose-button'
        onClick={insertImage}
        tooltip='Insert image'
        variant={FilledVariant.UNFILLED}
      />
    </div>
  );

  const linkButton = (
    <div>
      <IconButton
        disabled={!linkActionEnable}
        icon={Icon.Link}
        key='link-compose-button'
        onClick={toggleLink}
        tooltip='Insert link'
        variant={FilledVariant.UNFILLED}
      />
    </div>
  );

  const attachmentsButton = (
    <div>
      <IconButton
        icon={Icon.PaperClip}
        key='attachments-compose-button'
        onClick={openAttachmentSelect}
        tooltip='Add attachments'
        variant={FilledVariant.UNFILLED}
      />
    </div>
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
