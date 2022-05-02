import '../components/MailEditor/editor.css';
import '../theme/app.global.css';
import '@skiff-org/skiff-ui/src/style.scss';
import '../theme/app.global.css';
import '@skiff-org/skiff-ui/src/style.scss';
import '../components/shared/CustomSnackbar/CustomSnackbar.css';
import '../components/shared/CmdPalette/CmdPalette.css';
import '../components/labels/LabelDropdown.scss';

import { ApolloProvider } from '@apollo/client';
import { AppProps } from 'next/app';
import { SnackbarProvider } from 'notistack';
import { DndProvider } from 'react-dnd';
import { Provider } from 'react-redux';

import client from '../apollo/client';
import { Layout } from '../components/layout/Layout';
import { MessageDragLayer } from '../components/mailbox/MessageCell/MessageDragLayer';
import MobileHead from '../components/shared/MobileHead';
import store from '../redux/store/reduxStore';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { CustomHTML5Backend } from '../utils/dragAndDrop';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Provider store={store}>
        <AppThemeProvider>
          <DndProvider backend={CustomHTML5Backend}>
            <SnackbarProvider maxSnack={7}>
              <MobileHead />
              <main className='app'>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </main>
            </SnackbarProvider>
            <MessageDragLayer />
          </DndProvider>
        </AppThemeProvider>
      </Provider>
    </ApolloProvider>
  );
}

export default CustomApp;
