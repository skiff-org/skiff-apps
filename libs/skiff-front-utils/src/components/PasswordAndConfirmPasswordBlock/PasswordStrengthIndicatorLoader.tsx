/* eslint-disable react/jsx-props-no-spreading */
import React, { Suspense } from 'react';

const PasswordStrengthIndicator = React.lazy(() => import('./PasswordStrengthIndicator'));

type PasswordStrengthIndicatorLoaderProps = React.ComponentProps<typeof PasswordStrengthIndicator>;

// PasswordStrengthBar relies on zxcvbn which is quite big (2MB uncompressed, 940kB compressed)
// so we load it lazily to lower the initial bundle weight

const PasswordStrengthIndicatorLoader = (props: PasswordStrengthIndicatorLoaderProps) => (
  <Suspense fallback={null}>
    <PasswordStrengthIndicator {...props} />
  </Suspense>
);

export default PasswordStrengthIndicatorLoader;
