// needed to make sure webpack includes
import { createBrowserHistory } from 'history';
import React, { Suspense } from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import { getEnvironment } from 'skiff-front-utils';

import { Layout } from './components/layout/Layout';
import { MailAppRoutes } from './constants/route.constants';
import lazyloadRoute from './utils/lazyloadRoute';

const history = createBrowserHistory({ basename: MailAppRoutes.MAIL });

const loggedInRoutes = [
  {
    path: [MailAppRoutes.OAUTH],
    component: lazyloadRoute(() => import('./pages/Oauth'))
  },
  {
    path: [MailAppRoutes.SEARCH],
    component: lazyloadRoute(() => import('./pages/FullViewSearch'))
  },
  {
    path: [MailAppRoutes.USER_LABEL_MAILBOX],
    component: lazyloadRoute(() => import('./pages/UserLabelMailbox'))
  },
  {
    path: [MailAppRoutes.MAILBOX],
    component: lazyloadRoute(() => import('./pages/SystemLabelMailbox'))
  }
];

export default function Routes() {
  const env = getEnvironment(new URL(window.location.origin));

  return (
    <Router history={history}>
      <Switch>
        <Suspense fallback={null}>
          <Layout>
            <Route path={loggedInRoutes.map(({ path }) => path).flat()}>
              <Switch>
                {loggedInRoutes.map((route) => (
                  <Route
                    component={route.component}
                    key={Array.isArray(route.path) ? route.path[0] : route.path}
                    path={route.path}
                  />
                ))}
              </Switch>
            </Route>
          </Layout>
          {/**
           * Only render the skemail login container during local development. If we're not running
           * the app locally and the user is not logged in, we will redirect to the editor login page.
           */}
          {env === 'local' && (
            <Route
              component={lazyloadRoute(() => import('./pages/SkemailLoginContainer'))}
              path={[MailAppRoutes.HOME]}
            />
          )}
        </Suspense>
      </Switch>
    </Router>
  );
}
