import React from 'react';
import 'nightwatch-ui/dist/esm/index.css';
import './theme/app.global.css';
import { render } from 'react-dom';

import App from './App';

/**
 * While loading the App component display loader
 */
document.addEventListener('DOMContentLoaded', () => {
  render(<App />, document.getElementById('root'));
});
