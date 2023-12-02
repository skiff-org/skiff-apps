import { BANNER_HEIGHT } from 'nightwatch-ui';
import React, { FC, Suspense, useEffect } from 'react';
import { lazyWithPreload } from 'skiff-front-utils';
import styled from 'styled-components';

import { SIDEBAR_WIDTH } from '../../constants';
import { useAppSelector } from '../../utils';
import { CalendarSidebar } from '../CalendarSidebar';

const MobileBanner = lazyWithPreload(() => import('../MobileBanner/MobileBanner'));

const Body = styled.div`
  display: flex;
  width: calc(100% - ${SIDEBAR_WIDTH}px);
  display: flex;
  flex-direction: column;
`;

const FullScreen = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;

const BrowserContainer = styled.div<{ numBannerOpen?: number }>`
  width: 100%;
  height: ${(props) =>
    props.numBannerOpen && props.numBannerOpen > 0 ? `calc(100% - ${props.numBannerOpen * BANNER_HEIGHT}px)` : '100%'};
  display: flex;
`;

interface WebLayoutProps {
  isLoggedIn: boolean;
}

const WebLayout: FC<WebLayoutProps> = ({ children, isLoggedIn }) => {
  const bannersOpen = useAppSelector((state) => state.modal.bannersOpen);
  const numBannerOpen = bannersOpen.length;
  useEffect(() => {
    void Promise.all([MobileBanner.preload()]);
  }, []);

  return (
    <FullScreen>
      {isLoggedIn && (
        <Suspense fallback={<></>}>
          <MobileBanner />
        </Suspense>
      )}
      <BrowserContainer numBannerOpen={numBannerOpen}>
        <CalendarSidebar />
        <Body>{children}</Body>
      </BrowserContainer>
    </FullScreen>
  );
};

export default WebLayout;
