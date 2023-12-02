import { ApolloProvider } from '@apollo/client';
import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import { SnackbarProvider } from 'notistack';
import { DndProvider } from 'react-dnd';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { AppThemeProvider, ErrorPage } from 'skiff-front-utils';
import { getMailDomain } from 'skiff-utils';

import client from './apollo/client';
import { MailDragLayer } from './components/Compose/AddressAndSubjectFields/MailDragLayer';
import { MessageDragLayer } from './components/mailbox/MessageCell/MessageDragLayer';
import MobileHead from './components/shared/MobileHead';
import store from './redux/store/reduxStore';
import Routes from './Routes';
import { CustomHTML5Backend } from './utils/dragAndDrop';

function App() {
  return (
    <ErrorBoundary FallbackComponent={() => <ErrorPage client={client} origin='Mail' />}>
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
                  <FloatingDelayGroup delay={{ open: 1000, close: 200 }}>
                    <Routes />
                  </FloatingDelayGroup>
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

export default !!process.env.LD_CLIENT_SIDE_ID
  ? withLDProvider({
      clientSideID: process.env.LD_CLIENT_SIDE_ID,
      options: {
        streamUrl: process.env.SKIP_RELAY_PROXY ? undefined : 'https://relay-proxy.' + getMailDomain() + ':443',
        baseUrl: process.env.SKIP_RELAY_PROXY ? undefined : 'https://relay-proxy.' + getMailDomain() + ':443',
        eventsUrl: process.env.SKIP_RELAY_PROXY ? undefined : 'https://relay-proxy.' + getMailDomain() + ':443',
        sendEvents: false
      },
      user: {
        key: 'unauthenticated_user'
      }
    })(App)
  : App;
