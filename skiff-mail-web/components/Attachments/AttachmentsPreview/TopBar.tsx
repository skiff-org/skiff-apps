import {
  Icon,
  IconButton,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographyWeight,
  getThemedColor
} from '@skiff-org/skiff-ui';
import { FC } from 'react';
import { Email, SystemLabels, UserThread } from 'skiff-graphql';
import { bytesToHumanReadable } from 'skiff-utils';
import styled from 'styled-components';

import { useNavigate } from '../../../utils/navigation';
import { ClientAttachment } from '../types';
import useAttachments from '../useAttachments';

const TopBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 8px 8px 16px;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  background: ${getThemedColor('var(--bg-l1-solid)', ThemeMode.DARK)};
  border-radius: 8px 8px 0px 0px;
  z-index: 9999;
`;

const RightSection = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.26);
`;

interface TopBarProps {
  attachment: ClientAttachment;
  closeModal: () => void;
  thread?: UserThread;
  email?: Email;
  onPrev?: () => void;
  onNext?: () => void;
}

const TopBar: FC<TopBarProps> = ({ attachment, thread, email, onPrev, onNext, closeModal }) => {
  const { navigateToSystemLabel } = useNavigate();
  const { downloadAttachment } = useAttachments({ clientAttachments: [attachment] });

  const { threadID, attributes } = thread ?? {};
  const { id: attachmentID, contentType, name, size } = attachment;
  const { id: emailID, decryptedSubject } = email ?? {};
  const activeThreadQuery = { threadID, emailID };

  const PrimaryText: React.FC = ({ children }) => (
    <Typography forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
      {children}
    </Typography>
  );

  const SecondaryText: React.FC = ({ children }) => (
    <Typography color='secondary' forceTheme={ThemeMode.DARK}>
      {children}
    </Typography>
  );

  const humanReadableSize = size ? bytesToHumanReadable(size) : '';

  return (
    <TopBarContainer>
      <PrimaryText>{name}</PrimaryText>
      <SecondaryText>{humanReadableSize}</SecondaryText>
      <VerticalDivider />
      {email && (
        <>
          <PrimaryText>{decryptedSubject}</PrimaryText>
          <SecondaryText>{email?.from.name ?? email?.from.address}</SecondaryText>
          {thread && (
            <IconButton
              forceTheme={ThemeMode.DARK}
              icon={Icon.ExternalLink}
              onClick={() => void navigateToSystemLabel(attributes?.systemLabels[0] as SystemLabels, activeThreadQuery)}
              size={Size.SMALL}
            />
          )}
          <VerticalDivider />
        </>
      )}
      <IconText
        color='primary'
        forceTheme={ThemeMode.DARK}
        onClick={(e) => {
          e?.stopPropagation();
          void downloadAttachment(attachmentID, contentType, name);
        }}
        startIcon={Icon.Download}
      />
      <RightSection>
        {(!!onPrev || !!onNext) && (
          <>
            <IconButton
              disabled={!onPrev}
              forceTheme={ThemeMode.DARK}
              icon={Icon.Backward}
              onClick={(e) => {
                e.stopPropagation();
                if (onPrev) onPrev();
              }}
            />
            <IconButton
              disabled={!onNext}
              forceTheme={ThemeMode.DARK}
              icon={Icon.Forward}
              onClick={(e) => {
                e.stopPropagation();
                if (onNext) onNext();
              }}
            />
            <VerticalDivider />
          </>
        )}
        <IconButton
          forceTheme={ThemeMode.DARK}
          icon={Icon.Close}
          onClick={(e) => {
            e.stopPropagation();
            closeModal();
          }}
        />
      </RightSection>
    </TopBarContainer>
  );
};

export default TopBar;
