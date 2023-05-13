import { Divider } from 'nightwatch-ui';
import { MobileView } from 'react-device-detect';

import { Attachments, ClientAttachment } from '../Attachments';
import { MESSAGE_MAX_SIZE_IN_BYTES } from '../MailEditor/Plugins/MessageSizePlugin';

interface MobileAttachmentsProps {
  attachments: ClientAttachment[];
  attachmentsSize: number;
  removeAttachment: (id: string) => void;
}
export default function MobileAttachments({ attachments, attachmentsSize, removeAttachment }: MobileAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <MobileView>
      <Divider />
      <Attachments
        attachmentSizeExceeded={attachments.length ? attachmentsSize > MESSAGE_MAX_SIZE_IN_BYTES : false}
        attachments={attachments}
        onDelete={(id) => {
          removeAttachment(id);
        }}
      />
    </MobileView>
  );
}
