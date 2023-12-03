import React from 'react';
import 'nightwatch-ui/dist/esm/index.css';
import './theme/app.global.css';
import i18n from 'skiff-i18n';
import { I18nextProvider } from 'react-i18next';
import { render } from 'react-dom';

import App from './App';

/**
 * While loading the App component display loader
 */
document.addEventListener('DOMContentLoaded', () => {
  render(
    <I18nextProvider i18n={i18n} defaultNS={'general'}>
      <App />
    </I18nextProvider>,
    document.getElementById('root')
  );
});
