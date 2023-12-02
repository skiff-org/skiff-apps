import React, { FC } from 'react';
import { useAsyncHcaptcha, BrowserDesktopView } from 'skiff-front-utils';

import { Calendar } from '../components/Calendar';
import MemoizeDexieLiveQueriesProvider from '../components/Calendar/MemoizeDexieLiveQueriesProvider';
import { CalendarHeader } from '../components/CalendarHeader';

const Home: FC = () => {
  const { hcaptchaElement } = useAsyncHcaptcha(true);

  return (
    <MemoizeDexieLiveQueriesProvider>
      {hcaptchaElement}
      <BrowserDesktopView>
        <CalendarHeader />
      </BrowserDesktopView>
      <Calendar />
    </MemoizeDexieLiveQueriesProvider>
  );
};

export default Home;
