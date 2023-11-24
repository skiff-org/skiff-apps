import { ApolloProvider } from '@apollo/client';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import { SnackbarProvider } from 'notistack';
import { ErrorBoundary } from 'react-error-boundary';
import { Provider } from 'react-redux';
import { AppThemeProvider, ErrorPage } from 'skiff-front-utils';
import { getMailDomain } from 'skiff-utils';

import client from './apollo/client';
import store from './redux/store/reduxStore';
import { Routes } from './routes/Routes';

const DB_ERROR_MESSAGE = '"current" is read-only';
function fallbackRender({ error }: { error: Error }) {
  const isDbError = error.message.includes(DB_ERROR_MESSAGE);
  return <ErrorPage client={client} isDbError={isDbError} origin='Calendar' />;
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={fallbackRender}>
      <ApolloProvider client={client}>
        <Provider store={store}>
          <AppThemeProvider>
            <SnackbarProvider
              classes={{
                containerRoot: 'mobile-bar-offset'
              }}
              maxSnack={7}
              preventDuplicate
            >
              <main className='app'>
                <Routes />
              </main>
            </SnackbarProvider>
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
