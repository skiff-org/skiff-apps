import { LocalStorageThemeMode, StorageOnlyThemeMode, ThemeMode } from '@skiff-org/skiff-ui';
import { TitleActionSection, useTheme } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import Illustration, { Illustrations } from '../../../../svgs/Illustration';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';
import SelectBox from '../../../shared/SelectBox';

import { DARK_THEME_SELECT, LIGHT_THEME_SELECT, SYSTEM_THEME_SELECT } from './ThemeSelectID.constants';

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
  const { setStoredTheme, storedTheme } = useTheme();

  const updateTheme = (newTheme: LocalStorageThemeMode) => {
    setStoredTheme(newTheme);
    void storeWorkspaceEvent(WorkspaceEventType.SelectTheme, newTheme, THEME_SELECT_VERSION);
  };

  const setThemeDark = () => updateTheme(ThemeMode.DARK);
  const setThemeLight = () => updateTheme(ThemeMode.LIGHT);
  const setSystem = () => updateTheme(StorageOnlyThemeMode.SYSTEM);

  return (
    <>
      <TitleActionSection subtitle='Change the appearance of Skiff' title='Theme' />
      <Container>
        <SelectBox
          bgColor='#F5F5F5'
          checked={storedTheme === ThemeMode.LIGHT}
          dataTest={LIGHT_THEME_SELECT}
          forceTheme={ThemeMode.LIGHT}
          iconSvg={<Illustration illustration={Illustrations.LightMode} />}
          label='Light'
          onClick={setThemeLight}
          position='right'
        />
        <SelectBox
          bgColor='#292929'
          checked={storedTheme === ThemeMode.DARK}
          dataTest={DARK_THEME_SELECT}
          forceTheme={ThemeMode.DARK}
          iconSvg={<Illustration illustration={Illustrations.DarkMode} />}
          label='Dark'
          onClick={setThemeDark}
          position='right'
        />
        <SelectBox
          bgColor='#E5E5E5'
          checked={storedTheme === StorageOnlyThemeMode.SYSTEM}
          dataTest={SYSTEM_THEME_SELECT}
          forceTheme={ThemeMode.LIGHT}
          iconSvg={<Illustration illustration={Illustrations.SystemMode} />}
          label='System'
          onClick={setSystem}
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
