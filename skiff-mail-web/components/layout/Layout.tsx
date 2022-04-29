import { BottomNavigation } from '@mui/material';
import { useRouter } from 'next/router';
import { isMobile } from 'react-device-detect';
import { BrowserView, MobileView } from 'react-device-detect';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ALLOWED_UNAUTHENTICATED_ROUTES } from '../../constants/route.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useFetchCurrentUser from '../../hooks/useFetchCurrentUser';
import { ModalType } from '../../redux/reducers/modalTypes';
import { RootState } from '../../redux/store/reduxStore';
import ComposePanel from '../Compose';
import Compose from '../Compose/Compose';
import { BlockUnblockSenderModal } from '../modals/BlockUnblockSenderModal';
import { CreateOrEditUserLabelModal } from '../modals/CreateOrEditUserLabelModal';
import LogoutModal from '../modals/LogoutModal';
import { ReportPhishingOrConcernModal } from '../modals/ReportPhishingOrConcernModal';
import { SkemailWelcomeModal } from '../modals/SkemailWelcomeModal';
import { BOTTOM_TOOLBAR } from '../shared/BottomToolbars';
import CmdPalette from '../shared/CmdPalette/CmdPalette';
import GlobalHotkeys from '../shared/GlobalHotKeys';
import { MobileMenu } from './MobileMenu';
import { Sidebar } from './Sidebar';

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  background: var(--bg-l1-solid);
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

export const Layout: React.FC = ({ children }) => {
  const { isLoading, isLoggedIn } = useFetchCurrentUser();
  const toolbarContent = useAppSelector((state) => state.toolbar.content);
  const { isComposeCollapsed, openModal } = useAppSelector((state) => state.modal);

  // Redux selectors and actioopenModal: openSharedModal
  const composeOpen = useSelector((state: RootState) => state.modal.composeOpen);

  const router = useRouter();
  // So that we don't have a flash of the wrong content
  // when we redirect due to authentication.
  const isRedirecting =
    (!ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname) && !isLoggedIn) ||
    (ALLOWED_UNAUTHENTICATED_ROUTES.has(router.pathname) && isLoggedIn);
  if (isLoading || isRedirecting) {
    return null;
  }

  const renderSharedModal = () => {
    switch (openModal?.type) {
      case ModalType.CreateOrEditUserLabel:
        return <CreateOrEditUserLabelModal />;
      case ModalType.ReportPhishingOrConcern:
        return <ReportPhishingOrConcernModal />;
      case ModalType.BlockUnblockSender:
        return <BlockUnblockSenderModal />;
      case ModalType.SkemailWelcome:
        return <SkemailWelcomeModal />;
      case ModalType.Logout:
        return <LogoutModal />;
      default:
        return null;
    }
  };

  return (
    <>
      <BrowserView>
        <Container>
          {isLoggedIn && !isMobile && (
            <>
              <GlobalHotkeys />
              <Sidebar />
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
        </Container>
      </BrowserView>
      <MobileView>
        {isLoggedIn && (
          <Container style={{ flexDirection: 'column' }}>
            <MobileMenu body={children} />
            <BottomNavigation className={BOTTOM_TOOLBAR}>{toolbarContent}</BottomNavigation>
            {composeOpen && <Compose />}
          </Container>
        )}
        {!isLoggedIn && (
          <Container>
            <Body>{children}</Body>
          </Container>
        )}
      </MobileView>
      {/* Modals */}
      {isLoggedIn && (
        <>
          {renderSharedModal()}
          <CmdPalette />
        </>
      )}
    </>
  );
};
