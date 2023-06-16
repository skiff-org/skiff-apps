import React, { ComponentType } from 'react';

// Preload lazy component
// Taken from https://medium.com/hackernoon/lazy-loading-and-preloading-components-in-react-16-6-804de091c82d
type Factory<T> = () => Promise<{
  default: T;
}>;

/**
 * Lazy-load component to utilize code-splitting and reduce bundle size.
 * Then pre-load component to reduce impact on interactivity speeds.
 *
 * IMPORTANT NOTE: Does not work with NextJs, use NextJs Dynamic for similar results
 *  https://nextjs.org/docs/advanced-features/dynamic-import
 */
export function lazyWithPreload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const Component = React.lazy(factory) as React.LazyExoticComponent<T> & { preload: Factory<T> };
  Component.preload = factory;
  return Component;
}
