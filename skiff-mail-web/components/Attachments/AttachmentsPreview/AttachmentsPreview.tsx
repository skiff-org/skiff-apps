import { TopAppBar } from '@skiff-org/skiff-ui';
import { Icon, IconButton, ProgressSizes } from 'nightwatch-ui';
import { FC, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useAttachments } from '..';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { isAttachmentPreviewModal } from '../../../redux/reducers/modalTypes';

import { AttachmentPreviewDisplay } from './previews';
import TopBar from './TopBar';

const BackgroundContainer = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100vw;
  height: 100vh;
  background: var(--bg-scrim);
  z-index: 999;
`;

const OuterContainer = styled.div`
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const ArrowsContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  z-index: 9999;
  transform: translateY(-50%);
`;

const MobileContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  left: 0px;
  top: 0px;
  width: 100vw;
  height: 100vh;
  background: var(--bg-l1-solid);
  z-index: 999;
`;

const MobileContent = styled.div`
  height: 100%;
  width: 100%;
  background: var(--bg-l0-solid);
  overflow: hidden;
`;

const Arrow = styled.div<{ direction: 'left' | 'right' }>`
  ${(props) => `float: ${props.direction}`};
  ${(props) => `margin-${props.direction}: 100px`};
`;

const AttachmentsPreview: FC = () => {
  const dispatch = useDispatch();
  const { openModal } = useAppSelector((state) => state.modal);

  const closeModal = () => dispatch(skemailModalReducer.actions.setOpenModal());

  const {
    attachmentsMetadata,
    attachments: initialAttachments,
    initialAttachmentIndex,
    thread,
    email
  } = isAttachmentPreviewModal(openModal)
    ? openModal
    : { attachmentsMetadata: [], initialAttachmentIndex: 0, thread: undefined, email: undefined, attachments: [] };

  const { attachments, fetchAttachments, downloadAttachment } = useAttachments(
    { clientAttachments: initialAttachments, metadata: attachmentsMetadata },
    true
  );

  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState<number>(initialAttachmentIndex || 0);
  const currentAttachment = attachments[currentAttachmentIndex];

  useEffect(() => {
    if (initialAttachmentIndex === undefined) return;
    setCurrentAttachmentIndex(initialAttachmentIndex);
  }, [initialAttachmentIndex]);

  if (isMobile && attachments[currentAttachmentIndex]) {
    return (
      <MobileContainer>
        <TopAppBar
          currentAttachment={currentAttachment}
          downloadAttachment={downloadAttachment}
          onLeftItemClick={closeModal}
          title={attachments[currentAttachmentIndex].name}
        />
        <MobileContent>
          <AttachmentPreviewDisplay
            attachment={currentAttachment}
            previewProps={{
              refetch: () => {
                void fetchAttachments([attachments[currentAttachmentIndex].id], true);
              },
              progressSize: ProgressSizes.XLarge,
              tryToOpenProtectedPdf: true
            }}
          />
        </MobileContent>
      </MobileContainer>
    );
  }

  return (
    <BackgroundContainer onClick={closeModal}>
      {attachments.length > 0 && (
        <OuterContainer>
          <TopBar attachment={currentAttachment} email={email} thread={thread} />
          <ArrowsContainer
            onClick={(e) => {
              // prevents accidentally closing the preview when the attachments end
              e.stopPropagation();
            }}
          >
            {currentAttachmentIndex > 0 && attachments[currentAttachmentIndex - 1] && (
              <Arrow direction='left'>
                <IconButton
                  icon={Icon.ChevronLeft}
                  onClick={(e) => {
                    setCurrentAttachmentIndex((old) => old - 1);
                    e.stopPropagation();
                  }}
                  tooltip={attachments[currentAttachmentIndex - 1].name}
                  type='filled'
                />
              </Arrow>
            )}
            {attachments.length - 1 > currentAttachmentIndex && (
              <Arrow direction='right'>
                <IconButton
                  icon={Icon.ChevronRight}
                  onClick={(e) => {
                    setCurrentAttachmentIndex((old) => old + 1);
                    e.stopPropagation();
                  }}
                  tooltip={attachments[currentAttachmentIndex + 1].name}
                  type='filled'
                />
              </Arrow>
            )}
          </ArrowsContainer>
          <AttachmentPreviewDisplay
            attachment={currentAttachment}
            previewProps={{
              refetch: () => {
                void fetchAttachments([attachments[currentAttachmentIndex].id], true);
              },
              progressSize: ProgressSizes.XLarge,
              tryToOpenProtectedPdf: true
            }}
          />
        </OuterContainer>
      )}
    </BackgroundContainer>
  );
};

export default AttachmentsPreview;
