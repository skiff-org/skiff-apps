import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { CustomCircularProgress, ProgressSizes } from 'nightwatch-ui';
import { FC, useEffect } from 'react';
import { isAndroid, isMobile } from 'react-device-detect';
import { BrowserView, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  FeedbackModal,
  QrCodeModal,
  useTheme,
  PaywallModal,
  TabPage,
  LogoutModal,
  AddEmailModal
} from 'skiff-front-utils';
import { DowngradeModal, isDesktopApp, isMobileApp, sendRNWebviewMsg } from 'skiff-front-utils';
import styled from 'styled-components';

import { MOBILE_MAIL_BODY_ID } from '../../constants/mailbox.constants';
import { ALLOWED_UNAUTHENTICATED_ROUTES } from '../../constants/route.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAddBackupEmail } from '../../hooks/useAddBackupEmail';
import useFetchCurrentUser from '../../hooks/useFetchCurrentUser';
import { useMailLogout } from '../../hooks/useMailLogout';
import { useInitializeSearchWorker } from '../../hooks/useSearchWorker';
import useSyncURLSearchParams from '../../hooks/useSyncURLSearchParams';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { sendFeedback } from '../../utils/feedbackUtils';
import { SearchProvider } from '../../utils/search/SearchProvider';
import { AttachmentsPreview } from '../Attachments';
import MobileBanner from '../banners/MobileBanner';
import ComposePanel from '../Compose';
import Compose from '../Compose/Compose';
import Meta from '../Meta';
import { BlockUnblockSenderModal } from '../modals/BlockUnblockSenderModal';
import { CreateOrEditLabelOrFolderModal } from '../modals/CreateOrEditLabelOrFolderModal';
import { ImportMailModal } from '../modals/ImportMailModal';
import { InviteUsersMailModal } from '../modals/InviteUsersMailModal';
import { ReferralSplashModal } from '../modals/ReferralSplashModal';
import { ReportPhishingOrConcernModal } from '../modals/ReportPhishingOrConcernModal';
import { SkemailWelcomeModal } from '../modals/SkemailWelcomeModal';
import UnSendModal from '../ScheduleSend/unsendPopup';
import { useSettings } from '../Settings/useSettings';
import CmdPalette from '../shared/CmdPalette/CmdPalette';
import GlobalHotkeys from '../shared/hotKeys/GlobalHotKeys';
import MobileAppEventListener from '../shared/MobileAppEventListener/MobileAppEventListener';
import ShortcutsMenu from '../shared/ShortcutsMenu/ShortcutsMenu';

import { InitNotification } from './InitNotification';
import { MailSidebar } from './MailSidebar';
import useCachingWorker from './useCachingWorker';

const FullScreen = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const BrowserContainer = styled.div<{ numBannerOpen?: number }>`
  width: 100%;
  height: ${(props) =>
    props.numBannerOpen && props.numBannerOpen > 0 ? `calc(100% - ${props.numBannerOpen * 40}px)` : '100%'};
  display: flex;
  background: var(--bg-l1-solid);
`;

const MobileContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  box-sizing: border-box;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  width: calc(100% - 240px);
`;

const ComposeContainer = styled.div<{ collapsed: boolean }>`
  padding: ${(props) => (props.collapsed ? '0' : '0px 24px')};
  box-sizing: border-box;
`;

const MobileBody = styled.div<{ settingsOpen: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100vw;
  padding-top: constant(safe-area-inset-top); /* IOS < 11.2*/
  padding-top: env(safe-area-inset-top); /* IOS > = 11.2*/
  ${isMobileApp() && isAndroid && `padding-top:${window.statusBarHeight.toString() + 'px'};`}
  flex: 1;
  background: var(--bg-l1-solid);
  transition: transform 0.2s cubic-bezier(0.3, 0, 0.5, 0.3);

  ${({ settingsOpen }) => (settingsOpen ? 'transform: scale(0.9);' : '')}
`;

const Settings = dynamic(() => import('../Settings/Settings'), { ssr: false });

export const Layout: FC = ({ children }) => {
  const { theme } = useTheme();
  const { isLoading, isLoggedIn } = useFetchCurrentUser();
  const { error: addEmailError, loading: isAddingEmail, runAddEmail, setError: setAddEmailError } = useAddBackupEmail();
  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  // This hook is used to allow for correct back/forward navigation
  // in spite of our direct manipulation of window.history to avoid
  // re-renders in some state changing operations (e.g. setActiveThread, openSettings)
  useSyncURLSearchParams();

  const numBannerOpen = bannersOpen.length;
  const { isComposeCollapsed, openModal, composeOpen } = useAppSelector((state) => state.modal);
  // email sending progress
  const { openSettings } = useSettings();

  useCachingWorker();
  // Initialize search worker to start indexing skemails
  useInitializeSearchWorker();

  const router = useRouter();
  // So that we don't have a flash of the wrong content
  // when we redirect due to authentication.
  const isRedirecting =
    (!ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname) && !isLoggedIn) ||
    (ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname) && isLoggedIn);

  // On mobile app tell RN that webview has loaded
  useEffect(() => {
    if (isLoading || isRedirecting || (!isMobileApp() && !isDesktopApp())) return;
    sendRNWebviewMsg('loaded', { isLoggedIn });
  }, [isLoading, isRedirecting]);

  const dispatch = useDispatch();
  const logout = useMailLogout();

  const closeOpenModal = () => dispatch(skemailModalReducer.actions.setOpenModal(undefined));

  if (isLoading || isRedirecting) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CustomCircularProgress size={ProgressSizes.XLarge} spinner />
      </div>
    );
  }

  const onLogout = () => {
    logout();
    closeOpenModal();
  };

  const renderCurrentModal = () => {
    switch (openModal?.type) {
      case ModalType.CreateOrEditLabelOrFolder:
        return <CreateOrEditLabelOrFolderModal />;
      case ModalType.ReportPhishingOrConcern:
        return <ReportPhishingOrConcernModal />;
      case ModalType.BlockUnblockSender:
        return <BlockUnblockSenderModal />;
      case ModalType.ImportMail:
        return <ImportMailModal />;
      case ModalType.SkemailWelcome:
        return <SkemailWelcomeModal />;
      case ModalType.ReferralSplash:
        return (
          <ReferralSplashModal
            creditBytes={openModal.creditBytes}
            isOpen={true}
            onClick={() => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.InviteUsers }))}
            onClose={closeOpenModal}
            referralCount={openModal.referralCount}
          />
        );
      case ModalType.Logout:
        return <LogoutModal isOpen={true} onClose={closeOpenModal} onLogout={onLogout} />;
      case ModalType.AttachmentPreview:
        return <AttachmentsPreview />;
      case ModalType.InviteUsers:
        return <InviteUsersMailModal />;
      case ModalType.UnSendMessage:
        return <UnSendModal />;
      case ModalType.QrCode:
        return (
          <QrCodeModal
            buttonProps={openModal.buttonProps}
            description={openModal.description}
            link={openModal.link}
            onClose={closeOpenModal}
            open={true}
            theme={theme}
            title={openModal.title}
          />
        );
      case ModalType.Feedback:
        return <FeedbackModal onClose={closeOpenModal} open={true} sendFeedback={sendFeedback} />;
      case ModalType.Paywall:
        return (
          <PaywallModal
            onClose={closeOpenModal}
            // Will need plans page in Skemail to link properly
            onUpgrade={() => {
              openSettings({ tab: TabPage.Plans });
            }}
            open
            paywallErrorCode={openModal.paywallErrorCode}
          />
        );
      case ModalType.AddEmail:
        return (
          <AddEmailModal
            closeDialog={closeOpenModal}
            error={addEmailError}
            loading={isAddingEmail}
            onSendSuccess={openModal?.onSendSuccess}
            runAddEmail={runAddEmail}
            setError={setAddEmailError}
          />
        );
      case ModalType.Downgrade:
        return (
          <DowngradeModal
            downgradeProgress={openModal.downgradeProgress}
            onClose={closeOpenModal}
            open
            tierToDowngradeTo={openModal.tierToDowngradeTo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SearchProvider>
      <Meta />
      <BrowserView>
        <FullScreen>
          {isLoggedIn && <MobileBanner />}
          {isLoggedIn && !isMobile && !window.ReactNativeWebView && <InitNotification />}
          <BrowserContainer numBannerOpen={numBannerOpen}>
            {isLoggedIn && !isMobile && (
              <>
                <GlobalHotkeys />
                <MailSidebar />
              </>
            )}
            <Body>{children}</Body>
            {isLoggedIn && (
              <ComposePanel open={composeOpen}>
                <ComposeContainer collapsed={isComposeCollapsed}>
                  <Compose />
                </ComposeContainer>
              </ComposePanel>
            )}
          </BrowserContainer>
        </FullScreen>
      </BrowserView>
      <MobileView>
        {isMobileApp() && <MobileAppEventListener />}
        {isLoggedIn && <MobileBanner />}
        {isLoggedIn && (
          <MobileContainer style={{ flexDirection: 'column', background: 'black' }}>
            <MobileBody id={MOBILE_MAIL_BODY_ID} settingsOpen={openModal?.type === ModalType.Settings}>
              {children}
            </MobileBody>
            {/* NOTE: Desktop is rendered conditionally but mobile is not, this may lead to behavior that needs to be addressed */}
            {/* e.g. Attachments not clearing on mobile */}
            <Compose />
          </MobileContainer>
        )}
        {!isLoggedIn && (
          <MobileContainer>
            <Body>{children}</Body>
          </MobileContainer>
        )}
      </MobileView>
      {isLoggedIn && (
        <>
          {/* Modals */}
          {renderCurrentModal()}
          <Settings />
          <CmdPalette />
          <ShortcutsMenu />
        </>
      )}
    </SearchProvider>
  );
};
