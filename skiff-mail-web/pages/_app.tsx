import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { AppProps } from 'next/app';
import '@skiff-org/skiff-ui/dist/esm/index.css';
import { SnackbarProvider } from 'notistack';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { AppThemeProvider, ErrorPage, saveCurrentUserData } from 'skiff-front-utils';

import 'react-image-crop/dist/ReactCrop.css';
import client from '../apollo/client';
import { MailDragLayer } from '../components/Compose/AddressAndSubjectFields/MailDragLayer';
import '../components/MailEditor/editor.css';
import '../components/ScheduleSend/DatePicker.scss';
import '../components/app.global.css';
import '../components/labels/LabelDropdown.scss';
import { Layout } from '../components/layout/Layout';
import { MessageDragLayer } from '../components/mailbox/MessageCell/MessageDragLayer';
import '../components/shared/CmdPalette/CmdPalette.css';
import MobileHead from '../components/shared/MobileHead';
import store from '../redux/store/reduxStore';
import { CustomHTML5Backend } from '../utils/dragAndDrop';
import { MOCK_USER } from '__mocks__/mockUser';
import { MockedProvider } from '@apollo/client/testing';

function CustomApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    saveCurrentUserData(MOCK_USER);
  }, []);
  return (
    <ErrorBoundary FallbackComponent={() => <ErrorPage client={client} origin='Skemail' />}>
      <MockedProvider>
        <Provider store={store}>
          <AppThemeProvider>
            <DndProvider backend={CustomHTML5Backend}>
              <SnackbarProvider
                classes={{
                  containerRoot: 'mobile-bar-offset'
                }}
                maxSnack={7}
                preventDuplicate
              >
                <MobileHead />
                <main className='app'>
                  <Layout>
                    <FloatingDelayGroup delay={{ open: 1000, close: 200 }}>
                      <Component {...pageProps} />
                    </FloatingDelayGroup>
                  </Layout>
                </main>
              </SnackbarProvider>
              <MessageDragLayer />
              <MailDragLayer />
            </DndProvider>
          </AppThemeProvider>
        </Provider>
      </MockedProvider>
    </ErrorBoundary>
  );
}

export default CustomApp;
