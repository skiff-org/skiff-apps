/* eslint-disable react/jsx-props-no-spreading */
import React, { ComponentType, Suspense } from 'react';

const lazyloadRoute = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) => {
  const Route = React.lazy(factory);

  // eslint-disable-next-line react/display-name
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={null}>
      <Route {...props} />
    </Suspense>
  );
};

export default lazyloadRoute;
