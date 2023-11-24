import { AnimatePresence } from 'framer-motion';
import { BANNER_HEIGHT, CircularProgress, Size } from 'nightwatch-ui';
import { FC, useCallback, useEffect } from 'react';
import React from 'react';
import { MobileView, isAndroid, isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  AddEmailModal,
  BrowserDesktopView,
  ConfirmModal,
  DowngradeModal,
  FeedbackModal,
  LogoutModal,
  PaywallModal,
  PlanDelinquencyModal,
  QrCodeModal,
  SettingValue,
  TabPage,
  isMobileApp,
  isReactNativeDesktopApp,
  sendRNWebviewMsg,
  useCheckoutResultToast,
  useTheme
} from 'skiff-front-utils';
import styled from 'styled-components';

import client from '../../apollo/client';
import { MOBILE_MAIL_BODY_ID } from '../../constants/mailbox.constants';
import { ALLOWED_UNAUTHENTICATED_ROUTES } from '../../constants/route.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useAddBackupEmail } from '../../hooks/useAddBackupEmail';
import useFetchCurrentUser from '../../hooks/useFetchCurrentUser';
import { useImportProgress } from '../../hooks/useImportProgress';
import { useMailLogout } from '../../hooks/useMailLogout';
import { useInitializeSearchWorker } from '../../hooks/useSearchWorker';
import useSyncURLSearchParams from '../../hooks/useSyncURLSearchParams';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { sendFeedback } from '../../utils/feedbackUtils';
import { SearchProvider } from '../../utils/search/SearchProvider';
import BulkSilenceModal from '../BulkSilenceModal/BulkSilenceModal';
import { useSettings } from '../Settings/useSettings';
import MobileAppEventListener from '../shared/MobileAppEventListener/MobileAppEventListener';

import MailSidebar from './MailSidebar';
import useCachingWorker from './useCachingWorker';

const SUPPORT_EMAIL_ADDR = 'support@skiff.org';

const Compose = React.lazy(() => import('../Compose/Compose'));
const AttachmentsPreview = React.lazy(() => import('../Attachments/AttachmentsPreview/AttachmentsPreview'));
const ReportPhishingOrConcernModal = React.lazy(() => import('../modals/ReportPhishingOrConcernModal'));
const ReferralSplashModal = React.lazy(() => import('../modals/ReferralSplashModal'));
const InviteUsersMailModal = React.lazy(() => import('../modals/InviteUsersMailModal'));
const CreateOrEditLabelOrFolderModal = React.lazy(() => import('../modals/CreateOrEditLabelOrFolderModal'));
const BlockUnblockSenderModal = React.lazy(() => import('../modals/BlockUnblockSenderModal'));
const GlobalHotkeys = React.lazy(() => import('../shared/hotKeys/GlobalHotKeys'));
const Banners = React.lazy(() => import('./Banners'));
const UnSendModal = React.lazy(() => import('../ScheduleSend/unsendPopup'));
const SearchOneClickCustomDomainsModal = React.lazy(
  () => import('../Settings/CustomDomains/SearchOneClick/SearchOneClickCustomDomainsModal')
);
const SkemailWelcomeModal = React.lazy(() => import('../modals/SkemailWelcomeModal'));
const CmdPalette = React.lazy(() => import('../shared/CmdPalette/CmdPalette'));
const ComposeAndComposePanel = React.lazy(() => import('./ComposeAndComposePanel'));

const FullScreen = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const BrowserContainer = styled.div<{ $numBannersOpen?: number }>`
  width: 100%;
  height: ${(props) =>
    props.$numBannersOpen && props.$numBannersOpen > 0
      ? `calc(100% - ${props.$numBannersOpen * BANNER_HEIGHT}px)`
      : '100%'};
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

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
const MobileBody = styled.div<{ settingsOpen: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100vw;
  padding-top: constant(safe-area-inset-top); /* IOS < 11.2*/
  padding-top: env(safe-area-inset-top); /* IOS > = 11.2*/
  ${isMobileApp() && isAndroid && `padding-top:${(window as any).statusBarHeight.toString() as string}px;`}
  flex: 1;
  background: var(--bg-main-container);
  transition: transform 0.2s cubic-bezier(0.3, 0, 0.5, 0.3);
  ${({ settingsOpen }) => (settingsOpen ? 'transform: scale(0.9); opacity: 0.68;' : '')}
`;
/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

const Settings = React.lazy(() => import('../Settings/Settings'));

export const Layout: FC = ({ children }) => {
  const { theme } = useTheme();
  const { isCachedLoginDone, isLoggedIn } = useFetchCurrentUser();
  const { error: addEmailError, loading: isAddingEmail, runAddEmail, setError: setAddEmailError } = useAddBackupEmail();
  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const numBannersOpen = bannersOpen.length;

  // This hook is used to allow for correct back/forward navigation
  // in spite of our direct manipulation of window.history to avoid
  // re-renders in some state changing operations (e.g. setActiveThread, openSettings)
  useSyncURLSearchParams();

  // check for completed or cancelled Stripe checkout redirects
  useCheckoutResultToast();

  const { openModal, composeOpen, replyComposeOpen } = useAppSelector((state) => state.modal);

  // email sending progress
  const { openSettings } = useSettings();

  useCachingWorker();
  // Initialize search worker to start indexing skemails
  useInitializeSearchWorker();

  const location = useLocation();
  // So that we don't have a flash of the wrong content
  // when we redirect due to authentication.
  const isRedirecting =
    (!ALLOWED_UNAUTHENTICATED_ROUTES.has(location.pathname) && !isLoggedIn) ||
    (ALLOWED_UNAUTHENTICATED_ROUTES.has(location.pathname) && isLoggedIn);

  // On mobile app tell RN that webview has loaded
  useEffect(() => {
    if (!isCachedLoginDone || isRedirecting || (!isMobileApp() && !isReactNativeDesktopApp())) return;
    sendRNWebviewMsg('loaded', { isLoggedIn });
  }, [isCachedLoginDone, isRedirecting, isLoggedIn]);

  const dispatch = useDispatch();
  const logout = useMailLogout();

  const refetchPaidUpStatus = useCallback(() => {
    void client.refetchQueries({
      include: ['getUserPaidUpStatus']
    });
  }, []);

  const closeOpenModal = () => dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  const openPlansTab = () => openSettings({ tab: TabPage.Plans, setting: SettingValue.SubscriptionPlans });

  useImportProgress();

  const onLogout = () => {
    void logout();
    closeOpenModal();
  };

  const getCurrentModal = () => {
    switch (openModal?.type) {
      case ModalType.CreateOrEditLabelOrFolder:
        return <CreateOrEditLabelOrFolderModal />;
      case ModalType.ReportPhishingOrConcern:
        return <ReportPhishingOrConcernModal />;
      case ModalType.BlockUnblockSender:
        return <BlockUnblockSenderModal />;
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
      case ModalType.InviteUsers:
        return <InviteUsersMailModal />;
      case ModalType.UnSendMessage:
        return <UnSendModal threadID={openModal.threadID} />;
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
      case ModalType.AttachmentPreview:
        return <AttachmentsPreview />;

      case ModalType.Feedback:
        return (
          <FeedbackModal
            onClose={closeOpenModal}
            open={true}
            openSupportCompose={() =>
              dispatch(skemailModalReducer.actions.directMessageCompose({ address: SUPPORT_EMAIL_ADDR }))
            }
            sendFeedback={sendFeedback}
          />
        );
      case ModalType.Paywall:
        return (
          <PaywallModal
            onClose={() => {
              closeOpenModal();
              openModal.onClose?.();
            }}
            onUpgrade={openPlansTab}
            open
            paywallErrorCode={openModal.paywallErrorCode}
          />
        );
      case ModalType.ConfirmSignature:
        return (
          <ConfirmModal
            confirmName='Remove'
            description={`Keeping \'Secured by Skiff\' helps spread the word about privacy-first, end-to-end encrypted communications.`}
            destructive
            onClose={closeOpenModal}
            onConfirm={() => {
              openModal.onConfirm();
              closeOpenModal();
            }}
            open
            title='Are you sure?'
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
      case ModalType.SearchCustomDomain:
        return <SearchOneClickCustomDomainsModal onClose={closeOpenModal} open />;
      case ModalType.PlanDelinquency:
        return (
          <PlanDelinquencyModal
            currentTier={openModal.currentTier}
            delinquentAlias={openModal.delinquentAlias}
            downgradeProgress={openModal.downgradeProgress}
            onClose={closeOpenModal}
            openPlansTab={openPlansTab}
            refetchPaidUpStatus={refetchPaidUpStatus}
          />
        );
      case ModalType.BulkUnsubscribe:
        return <BulkSilenceModal onClose={closeOpenModal} open={openModal?.type === ModalType.BulkUnsubscribe} />;
      default:
        return null;
    }
  };

  const renderCurrentModal = () => <AnimatePresence>{openModal && getCurrentModal()}</AnimatePresence>;

  if (!isCachedLoginDone || isRedirecting) {
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
        <CircularProgress size={Size.LARGE} spinner />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SearchProvider>
      <BrowserDesktopView>
        <FullScreen>
          {isLoggedIn && <Banners />}
          <BrowserContainer $numBannersOpen={numBannersOpen}>
            {isLoggedIn && !isMobile && (
              <>
                <GlobalHotkeys />
                <MailSidebar />
              </>
            )}
            <Body>{children}</Body>
            {isLoggedIn && (
              <ComposeAndComposePanel composeOpen={composeOpen || (replyComposeOpen.open && replyComposeOpen.popOut)} />
            )}
          </BrowserContainer>
        </FullScreen>
      </BrowserDesktopView>
      <MobileView>
        {isMobileApp() && <MobileAppEventListener />}
        {isLoggedIn && <Banners />}
        {isLoggedIn && (
          <MobileContainer style={{ flexDirection: 'column', background: 'var(--icon-link)' }}>
            <MobileBody id={MOBILE_MAIL_BODY_ID} settingsOpen={openModal?.type === ModalType.Settings}>
              {children}
            </MobileBody>
            {/* NOTE: Desktop is rendered conditionally but mobile is not, this may lead to behavior that needs to be addressed */}
            {/* e.g. Attachments not clearing on mobile */}
            {composeOpen && <Compose />}
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
        </>
      )}
    </SearchProvider>
  );
};
