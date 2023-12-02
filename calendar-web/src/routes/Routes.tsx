import { createBrowserHistory } from 'history';
import React from 'react';
import { Route, Router, Switch } from 'react-router-dom';

import { Layout } from '../components/Layout';

import Home from './Home';
import AppRoutes from './routes.constants';

const history = createBrowserHistory();

export const Routes = () => {
  return (
    <Router history={history}>
      <Layout>
        <Switch>
          <Route path={AppRoutes.HOME}>
            <Home />
          </Route>
        </Switch>
      </Layout>
    </Router>
  );
};
