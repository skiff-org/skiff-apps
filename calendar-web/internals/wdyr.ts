/// <reference types="@welldone-software/why-did-you-render" />

// Add info in the console about why a component re-rendered. To activate, set the env variable WDYR=1 before starting webpack
// And activate WDYR for each component you want to track:
// https://github.com/welldone-software/why-did-you-render#tracking-components
// TLDR: you need to add YourComponent.whyDidYouRender = true; to each component you want to track

import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  const ReactRedux = require('react-redux');
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    trackExtraHooks: [[ReactRedux, 'useSelector']]
  });
}
