import { Icon, IconButton, Typography } from 'nightwatch-ui';
import { FC } from 'react';
import { formatBytes } from 'skiff-front-utils';
import { Email, SystemLabels, UserThread } from 'skiff-graphql';
import styled from 'styled-components';

import { useNavigate } from '../../../utils/navigation';
import { ClientAttachment } from '../types';
import useAttachments from '../useAttachments';

const TopBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
  background: var(--bg-emphasis);
  backdrop-filter: blur(72px);
  border-radius: 8px;
  z-index: 9999;
  margin-top: 46px;
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.26);
`;

const NameTypography = styled(Typography)`
  max-width: 250px;
`;

interface TopBarProps {
  attachment: ClientAttachment;
  thread?: UserThread;
  email?: Email;
}

const TopBar: FC<TopBarProps> = ({ attachment, thread, email }) => {
  const { navigateToSystemLabel } = useNavigate();
  const { downloadAttachment } = useAttachments({ clientAttachments: [attachment] });

  const { threadID, attributes } = thread ?? {};
  const { id: attachmentID, contentType, name, size } = attachment;
  const { id: emailID, decryptedSubject } = email ?? {};
  const activeThreadQuery = { threadID, emailID };

  return (
    <TopBarContainer>
      <NameTypography color='white'>{name}</NameTypography>
      <Typography color='secondary' themeMode='dark'>
        &nbsp;/ {size ? formatBytes(size) : ''}
      </Typography>
      <VerticalDivider />
      {email && (
        <>
          <NameTypography color='white'>{decryptedSubject}</NameTypography>
          <Typography color='secondary' themeMode='dark'>
            {email?.from.name || email?.from.address}
          </Typography>
          {thread && (
            <IconButton
              color='white'
              icon={Icon.ExternalLink}
              onClick={async () => {
                await navigateToSystemLabel(attributes?.systemLabels[0] as SystemLabels, activeThreadQuery);
              }}
              size='small'
            />
          )}
          <VerticalDivider />
        </>
      )}
      <IconButton
        color='white'
        icon={Icon.Download}
        onClick={(e) => {
          e.stopPropagation();
          downloadAttachment(attachmentID, contentType, name);
        }}
      />
    </TopBarContainer>
  );
};

export default TopBar;
