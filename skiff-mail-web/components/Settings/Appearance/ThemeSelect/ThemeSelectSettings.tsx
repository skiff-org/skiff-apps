import React from 'react';
import { ThemeName, THEME_LOCAL_STORAGE_KEY, TitleActionSection, useTheme } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import Illustration, { Illustrations } from '../../../../svgs/Illustration';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';
import SelectBox from '../../../shared/SelectBox';

import { LIGHT_THEME_SELECT, DARK_THEME_SELECT } from './ThemeSelectID.constants';

const THEME_SELECT_VERSION = '0.1.0';
const Container = styled.div`
  gap: 20px;
  display: flex;
  width: 100%;

  @media (max-width: 479px) {
    text-align: center;
  }

  @media (max-width: 750px) {
    flex-direction: column;
    padding-bottom: 10px;
  }
`;

/**
 * Component for rendering the account recovery section of AccountSettings.
 * This component merely contains a button (along with a title and description),
 * whichs opens the account recovery setup dialog.
 */
function ThemeSelectSettings() {
  const { theme, setTheme } = useTheme();

  const updateTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    void storeWorkspaceEvent(WorkspaceEventType.SelectTheme, newTheme, THEME_SELECT_VERSION);
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, newTheme);
  };

  return (
    <>
      <TitleActionSection subtitle='Change the appearance of Skiff.' title='Theme' />
      <Container>
        <SelectBox
          bgColor='#F5F5F5'
          checked={theme === 'light'}
          dataTest={LIGHT_THEME_SELECT}
          iconSvg={<Illustration illustration={Illustrations.LightMode} />}
          label='Light mode'
          labelColor='black'
          onClick={() => updateTheme('light')}
          position='right'
        />
        <SelectBox
          bgColor='#292929'
          checked={theme === 'dark'}
          dataTest={DARK_THEME_SELECT}
          iconSvg={<Illustration illustration={Illustrations.DarkMode} />}
          label='Dark mode'
          labelColor='white'
          onClick={() => updateTheme('dark')}
          position='right'
        />
      </Container>
    </>
  );
}

ThemeSelectSettings.defaultProps = {
  showHeader: true
};

export default ThemeSelectSettings;
