import { AnimatePresence, motion } from 'framer-motion';
import { getThemedColor, Icon, IconText, Size, ThemeMode, useOnClickOutside } from 'nightwatch-ui';
import { BaseSyntheticEvent, FC, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { HotKeys } from 'react-hotkeys';
import { useDispatch } from 'react-redux';
import { FileTypes, HotKeyHandlers, MIMETypes } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAttachments } from '..';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { isAttachmentPreviewModal } from '../../../redux/reducers/modalTypes';
import { TopAppBar } from '../../../skiff-ui/src';

import { AttachmentPreviewDisplay } from './previews';
import TopBar from './TopBar';

const BackgroundScrim = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100vw;
  height: 100vh;
  background: var(--bg-scrim);
  z-index: 999;
`;

const OuterContainer = styled(motion.div)`
  box-sizing: border-box;
  width: 90vw;
  height: 84vh;
  display: flex;
  top: calc(50% - 42vh);
  left: calc(50% - 45vw);
  flex-direction: column;
  align-items: center;
  z-index: 9999;
  position: absolute;
  margin: auto;
  border-radius: 8px;
  border: 1px solid ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
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

const ZoomRelative = styled.div`
  position: absolute;
  z-index: 999999;
`;

const ZoomAbsolute = styled.div`
  position: absolute;
  z-index: 99999999;
  top: 0;
  width: 100%;
`;

const ZoomContainer = styled.div`
  position: absolute;
  display: flex;
  z-index: 999999;
  left: 16px;
  top: 67px;
  flex-direction: column;
  padding: 2px;
  border-radius: 8px;
  box-shadow: ${getThemedColor('var(--shadow-l1)', ThemeMode.DARK)};
  background: ${getThemedColor('var(--bg-l0-solid)', ThemeMode.DARK)};
`;

const TopBarAbsolute = styled.div`
  position: absolute;
  z-index: 999999;
  width: 100%;
`;

const Image = styled.div<{ $zoomLevel: number; $canZoom: boolean }>`
  overflow: hidden;
  :hover {
    overflow: auto;
  }
  margin-top: 44px;
  top: 0;
  height: 100%;
  width: 100%;
  z-index: 999998;
  display: ${({ $canZoom, $zoomLevel }) => (!$canZoom || $zoomLevel === 1 ? 'flex' : 'block')};
  align-items: center;
  justify-content: center;
  text-align-last: center;
  box-sizing: border-box;
  background: ${getThemedColor('var(--bg-l3-solid)', ThemeMode.DARK)};
  box-shadow: var(--shadow-l1);
  border-radius: 0px 0px 8px 8px;
  > img {
    height: ${({ $zoomLevel }) => ($zoomLevel === 1 ? 'auto' : `${80 * $zoomLevel}%`)};
    max-width: ${({ $zoomLevel }) => ($zoomLevel === 1 ? '50%' : 'none')};
    max-height: ${({ $zoomLevel }) => ($zoomLevel === 1 ? 'calc(100% - 50px)' : 'none')};
  }
  > div {
    width: 100% !important;
  }
  > * {
    border-radius: 4px;
  }
`;

const MobileContent = styled.div`
  height: 100%;
  width: 100%;
  background: var(--bg-l0-solid);
  overflow: hidden;
`;

const HiddenInput = styled.input`
  height: 0;
  opacity: 0;
  width: 0;
  user-select: none;
`;

enum AttachmentKeyActions {
  CLOSE = 'CLOSE',
  PREV = 'PREV',
  NEXT = 'NEXT'
}

// Key map for sequences of a single combination with multiple keys (keys must be pressed at the same time)
export const singleCombinationKeyMap = {
  [AttachmentKeyActions.CLOSE]: 'Escape',
  [AttachmentKeyActions.PREV]: 'left',
  [AttachmentKeyActions.NEXT]: 'right'
};

const ZOOM_STEP = 0.25;

const AttachmentsPreview: FC = () => {
  const dispatch = useDispatch();

  const { openModal } = useAppSelector((state) => state.modal);
  const closeModal = () => dispatch(skemailModalReducer.actions.setOpenModal());
  const modalRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hover, setHover] = useState(false);
  useOnClickOutside(modalRef, closeModal);

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
  }, [initialAttachmentIndex, openModal]);

  // reset zoom when changing images
  useEffect(() => {
    setZoomLevel(1);
  }, [currentAttachment]);

  const leftEnabled = !!attachments[currentAttachmentIndex - 1];
  const rightEnabled = !!attachments[currentAttachmentIndex + 1];
  if (isMobile && currentAttachment) {
    return (
      <MobileContainer>
        <TopAppBar
          currentAttachment={currentAttachment}
          downloadAttachment={downloadAttachment}
          onLeftItemClick={closeModal}
          title={currentAttachment.name}
        />
        <MobileContent>
          <AttachmentPreviewDisplay
            attachment={currentAttachment}
            previewProps={{
              refetch: () => {
                void fetchAttachments([currentAttachment.id], true);
              },
              progressSize: Size.LARGE,
              tryToOpenProtectedPdf: true
            }}
          />
        </MobileContent>
      </MobileContainer>
    );
  }

  const handlerWrapper = (handler: (e: KeyboardEvent | undefined) => void) => (e: KeyboardEvent | undefined) => {
    e?.preventDefault();
    ((e as unknown as BaseSyntheticEvent)?.nativeEvent as KeyboardEvent)?.stopImmediatePropagation();
    handler(e);
  };

  const onPrev = () => setCurrentAttachmentIndex((old) => old - 1);
  const onNext = () => setCurrentAttachmentIndex((old) => old + 1);

  const singleCombinationHandlers: HotKeyHandlers<typeof singleCombinationKeyMap> = {
    [AttachmentKeyActions.CLOSE]: handlerWrapper(closeModal),
    [AttachmentKeyActions.NEXT]: handlerWrapper(rightEnabled ? onNext : () => {}),
    [AttachmentKeyActions.PREV]: handlerWrapper(leftEnabled ? onPrev : () => {})
  };
  const fileMimeType = currentAttachment?.contentType || '';
  const canZoom = [...MIMETypes[FileTypes.Image]].includes(fileMimeType);

  return (
    <HotKeys allowChanges handlers={singleCombinationHandlers} keyMap={singleCombinationKeyMap}>
      <AnimatePresence>
        {isAttachmentPreviewModal(openModal) && (
          <>
            <BackgroundScrim />
            <OuterContainer
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              ref={modalRef}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
            >
              <HiddenInput autoFocus />
              {!!currentAttachment && (
                <TopBarAbsolute>
                  <TopBar
                    attachment={currentAttachment}
                    closeModal={closeModal}
                    email={email}
                    onNext={rightEnabled ? () => onNext() : undefined}
                    onPrev={leftEnabled ? () => onPrev() : undefined}
                    thread={thread}
                  />
                </TopBarAbsolute>
              )}
              <Image
                $canZoom={canZoom}
                $zoomLevel={zoomLevel}
                onMouseLeave={() => setHover(false)}
                onMouseOver={() => setHover(true)}
              >
                {canZoom && hover && (
                  <ZoomAbsolute>
                    <ZoomRelative>
                      <ZoomContainer>
                        <IconText
                          color='primary'
                          disabled={zoomLevel === 3}
                          forceTheme={ThemeMode.DARK}
                          onClick={() => setZoomLevel((old) => old + ZOOM_STEP)}
                          size={Size.LARGE}
                          startIcon={Icon.Plus}
                        />
                        <IconText
                          color='primary'
                          forceTheme={ThemeMode.DARK}
                          onClick={() => setZoomLevel(1)}
                          size={Size.LARGE}
                          startIcon={Icon.ZoomPlus}
                        />
                        <IconText
                          color='primary'
                          disabled={zoomLevel === 1}
                          forceTheme={ThemeMode.DARK}
                          onClick={() => setZoomLevel((old) => old - ZOOM_STEP)}
                          size={Size.LARGE}
                          startIcon={Icon.Minus}
                        />
                      </ZoomContainer>
                    </ZoomRelative>
                  </ZoomAbsolute>
                )}
                {!!currentAttachment && (
                  <AttachmentPreviewDisplay
                    attachment={currentAttachment}
                    previewProps={{
                      refetch: () => {
                        void fetchAttachments([currentAttachment.id], true);
                      },
                      progressSize: Size.LARGE,
                      tryToOpenProtectedPdf: true
                    }}
                  />
                )}
              </Image>
            </OuterContainer>
          </>
        )}
      </AnimatePresence>
    </HotKeys>
  );
};

export default AttachmentsPreview;
