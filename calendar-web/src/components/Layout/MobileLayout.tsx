import { FC } from 'react';
import { isAndroid } from 'react-device-detect';
import { isMobileApp } from 'skiff-front-utils';
import styled from 'styled-components';

import { MOBILE_CALENDAR_LAYOUT_ID } from '../../constants/calendar.constants';
import { EventInfoDrawer } from '../EventInfo';

import useMobileAppEvents from './mobileAppEvents/useMobileAppEvents';

const MobileHead: FC = () => {
  return (
    <head>
      <meta
        content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover'
        name='viewport'
      />
    </head>
  );
};

const SafeArea = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top);
  ${isMobileApp() && isAndroid && `padding-top:${window.statusBarHeight.toString() + 'px'};`}
`;

const Layout = styled.div``;

const MobileLayout: FC = ({ children }) => {
  useMobileAppEvents();

  return (
    <Layout id={MOBILE_CALENDAR_LAYOUT_ID}>
      <MobileHead />
      <SafeArea>{children}</SafeArea>
      <EventInfoDrawer />
    </Layout>
  );
};

export default MobileLayout;
