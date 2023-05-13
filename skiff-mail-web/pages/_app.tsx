import { ApolloProvider } from '@apollo/client';
import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import { AppProps } from 'next/app';
import 'nightwatch-ui/dist/esm/index.css';
import { SnackbarProvider } from 'notistack';
import { ComponentType } from 'react';
import { DndProvider } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { AppThemeProvider, ErrorPage } from 'skiff-front-utils';
import { getMailDomain } from 'skiff-utils';

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

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary FallbackComponent={() => <ErrorPage client={client} origin='Skemail' />}>
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
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default withLDProvider({
  clientSideID: process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID ? process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID : '',
  options: {
    streamUrl: process.env.NEXT_PUBLIC_SKIP_RELAY_PROXY ? undefined : 'https://relay-proxy.' + getMailDomain() + ':443',
    baseUrl: process.env.NEXT_PUBLIC_SKIP_RELAY_PROXY ? undefined : 'https://relay-proxy.' + getMailDomain() + ':443',
    eventsUrl: process.env.NEXT_PUBLIC_SKIP_RELAY_PROXY ? undefined : 'https://relay-proxy.' + getMailDomain() + ':443'
  },
  user: {
    key: 'unauthenticated_user'
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
})(CustomApp as ComponentType<{}>);
