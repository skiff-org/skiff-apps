import { ApolloProvider } from '@apollo/client';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import { AppProps } from 'next/app';
import 'nightwatch-ui/dist/esm/index.css';
import { SnackbarProvider } from 'notistack';
import { ComponentType } from 'react';
import { DndProvider } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { AppThemeProvider, ErrorPage } from 'skiff-front-utils';

import client from '../apollo/client';
import '../components/labels/LabelDropdown.scss';
import { MailDragLayer } from '../components/Compose/AddressAndSubjectFields/MailDragLayer';
import { Layout } from '../components/layout/Layout';
import { MessageDragLayer } from '../components/mailbox/MessageCell/MessageDragLayer';
import '../components/MailEditor/editor.css';
import '../components/ScheduleSend/DatePicker.scss';
import '../components/shared/CmdPalette/CmdPalette.css';
import MobileHead from '../components/shared/MobileHead';
import store from '../redux/store/reduxStore';
import '../components/app.global.css';
import { CustomHTML5Backend } from '../utils/dragAndDrop';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <ApolloProvider client={client}>
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
                    <Component {...pageProps} />
                  </Layout>
                </main>
              </SnackbarProvider>
              <MessageDragLayer />
              <MailDragLayer />
            </DndProvider>
          </AppThemeProvider>
        </Provider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default withLDProvider({
  clientSideID: process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID ? process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID : ''
  // eslint-disable-next-line @typescript-eslint/ban-types
})(CustomApp as ComponentType<{}>);
