import { LocalStorageThemeMode, StorageOnlyThemeMode, ThemeMode } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { Illustrations } from '../../svgs/Illustration';
import { useTheme } from '../../theme/AppThemeProvider';
import SelectBox, { SelectBoxDataTest } from '../SelectBox';

import TitleActionSection from './TitleActionSection';

const THEME_SELECT_VERSION = '0.1.0';
const Container = styled.div`
  gap: 20px;
  display: flex;
  width: 100%;

  ${isMobile
    ? `flex-direction: column;
    padding-bottom: 10px;`
    : `text-align: center;`}
`;

/**
 * Component for rendering the account recovery section of AccountSettings.
 * This component merely contains a button (along with a title and description),
 * whichs opens the account recovery setup dialog.
 */
function ThemeSelectSettings() {
  const { setStoredTheme, storedTheme } = useTheme();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  const updateTheme = (newTheme: LocalStorageThemeMode) => {
    setStoredTheme(newTheme);
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.SelectTheme,
          version: THEME_SELECT_VERSION,
          data: newTheme
        }
      }
    });
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
          dataTest={SelectBoxDataTest.LIGHT_THEME_SELECT}
          forceTheme={ThemeMode.LIGHT}
          illustrationSvg={Illustrations.LightMode}
          label='Light'
          onClick={setThemeLight}
          position='right'
        />
        <SelectBox
          bgColor='#292929'
          checked={storedTheme === ThemeMode.DARK}
          dataTest={SelectBoxDataTest.DARK_THEME_SELECT}
          forceTheme={ThemeMode.DARK}
          illustrationSvg={Illustrations.DarkMode}
          label='Dark'
          onClick={setThemeDark}
          position='right'
        />
        <SelectBox
          bgColor='#E5E5E5'
          checked={storedTheme === StorageOnlyThemeMode.SYSTEM}
          dataTest={SelectBoxDataTest.SYSTEM_THEME_SELECT}
          forceTheme={ThemeMode.LIGHT}
          illustrationSvg={Illustrations.SystemMode}
          label='System'
          onClick={setSystem}
          position='right'
        />
      </Container>
    </>
  );
}

export default ThemeSelectSettings;
