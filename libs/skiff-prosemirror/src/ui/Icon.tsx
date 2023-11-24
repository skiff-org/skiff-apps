import './skiff-icon.css';

import cx from 'classnames';
import memoize from 'lodash-es/memoize';
import values from 'lodash-es/values';
import { Icon as IconType, Icons, ThemeMode } from 'nightwatch-ui';
import React from 'react';

class Icon extends React.PureComponent<
  {
    type: string;
    title: string | null | undefined;
    forceTheme?: ThemeMode;
  },
  any,
  any
> {
  // Get the static Icon.
  // This is memoized to prevent rerendering the <img> element at each render if nothing changed
  // needed because the icon get passed as a prop to some pure components
  static get = memoize(
    (type: string, forceTheme?: ThemeMode): React.ReactElement<any> => (
      <Icons icon={type as IconType} forceTheme={forceTheme} />
    ), // custom resolver to concat args since memoize uses only first arg as cache key
    (...args: any) => values(args).join('_')
  );

  render(): React.ReactElement<any> {
    const { type } = this.props;
    let className = '';
    let children = '';
    className = cx('skiff-icon', {
      [type]: true
    });
    children = type;
    // TODO
    return <span className={className}>{children}</span>;
  }
}

export default Icon;
