import { animate, motion, useMotionValue } from 'framer-motion';
import escapeRegExp from 'lodash/escapeRegExp';
import {
  Color,
  CircularProgress,
  Drawer,
  Icon,
  Icons,
  IconText,
  Size,
  ThemeMode,
  themeNames,
  Toggle,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { FC, forwardRef, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { useIosBackdropEffect, useSwipeBack } from '../../hooks';
import { useTheme } from '../../theme/AppThemeProvider';
import MobileSearch from '../MobileSearch';
import { MobileAvatar, MobileAvatarProps } from '../UserAvatar';

import {
  DEFAULT_MOBILE_SETTINGS_INDICES,
  Setting,
  SettingIndices,
  SettingsSection,
  SettingsTab,
  SETTINGS_LABELS,
  SettingType,
  SettingValue,
  TabPage
} from './Settings.types';

// Currently magic number, worth to change it?
const SEARCH_BAR_HEIGHT = 80;

const DrawerOptions = styled.div`
  display: flex;
  flex-direction: column;
`;

const LowOpacity = styled.div`
  opacity: 0.35;
`;

const DrawerOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-self: flex-end;
  width: 100%;
  height: 46px;
  max-height: 46px;
  align-items: center;
  box-sizing: border-box;
  cursor: pointer;
  &:active {
    background: var(--bg-overlay-tertiary);
  }

  .dropdownItem {
    // remove right/left padding
    padding: 8px 0;
  }
`;

const LeftButton = styled.div`
  position: relative;
`;

const LeftButtonAbsolute = styled.div`
  position: absolute;
`;

const RightSection = styled.div<{ $isLast: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  height: 46px;
  border-bottom: ${({ $isLast }) => ($isLast ? 'none' : ' 1px solid var(--border-tertiary)')};
`;

export const SETTINGS_PAPER_ID = 'settingsPaper';
export const SCROLL_BOX_ID = 'scrollBox';

const SearchContainer = styled.div`
  position: sticky;
  top: 0;
  padding-top: 12px;
  z-index: 2;
  background: var(--bg-l3-solid);
`;

// fullsize=true when open it on mobile native and all the other implement so we need the innerpage tab fullsize so it will render inside webview
const DrawerInnerContainer = styled.div<{
  fullsize: boolean;
}>`
  ${({ fullsize }) => (fullsize ? '' : 'height: calc(100vh - 85px);')}
`;

const TabViewContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background: var(--bg-l3-solid);
  z-index: 9999;
  height: 100%;
  width: 100%;
`;

const InnerTabViewContainer = styled.div.attrs({ id: 'InnerTabViewContainer' })`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
`;

const SettingHeader = styled.div`
  padding: 0px 16px;
`;

const HeaderButton = styled.div`
  display: flex;
  align-items: center;
  align-self: center;
  width: 100%;
  justify-content: center;
`;

const NoResultsContainer = styled.div`
  padding: 0px 16px;
`;

const MotionTabViewContainer = motion(TabViewContainer);

const MotionDrawerOptions = motion(DrawerOptions);

const SETTING_CONTINER_ID = 'settingContainer';
const SINGLE_SETTING_CONTINER_ID = 'singleSettingContainer';

interface SettingTabViewProps {
  setting: Setting;
  parentLabel: string;
  onBack: () => void;
  onSwipe: (progress: string) => void;
  isPlansTab?: boolean;
  fullsize?: boolean;
}

const SettingTabView: FC<SettingTabViewProps> = ({ setting, parentLabel, onBack, onSwipe, isPlansTab, fullsize }) => {
  useSwipeBack(
    fullsize ? null : SINGLE_SETTING_CONTINER_ID, // In case it open from native mobile we want to disable the web swipe - we handle it on the native side
    SETTING_CONTINER_ID,
    () => {
      onBack();
    },
    undefined,
    (progress: string) => {
      onSwipe(progress);
      return true;
    }
  );

  useEffect(() => {
    if ((setting.type === SettingType.Tab || setting.type === SettingType.Custom) && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'settingInnerTabLoaded', value: true }));
    }
  }, [setting.type]);
  switch (setting.type) {
    case SettingType.Toggle:
      return null;
    case SettingType.Tab:
      return (
        <InnerTabViewContainer className='mobile-avoiding-keyboard'>
          {!fullsize && (
            <div>
              <LeftButton onClick={onBack}>
                <LeftButtonAbsolute>
                  <Icons icon={Icon.Backward} size={Size.X_MEDIUM} />
                </LeftButtonAbsolute>
              </LeftButton>
              <HeaderButton>
                <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
                  {setting.label}
                </Typography>
              </HeaderButton>
            </div>
          )}
          {/* Don't show additional header for Plans tab */}
          {!isPlansTab && <IconText label={setting.label} />}
          {setting.description && (
            <Typography color='secondary' wrap>
              {setting.description}
            </Typography>
          )}
          {setting.component}
        </InnerTabViewContainer>
      );
    case SettingType.Action:
      return null;
    case SettingType.Custom:
    default:
      return (
        <InnerTabViewContainer className='mobile-avoiding-keyboard'>
          {!fullsize && (
            <div>
              <LeftButton onClick={onBack}>
                <LeftButtonAbsolute>
                  <Icons icon={Icon.Backward} size={Size.X_MEDIUM} />
                </LeftButtonAbsolute>
              </LeftButton>
              <HeaderButton>
                <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
                  {setting.label}
                </Typography>
              </HeaderButton>
            </div>
          )}
          {setting?.component}
        </InnerTabViewContainer>
      );
  }
};

const IconCircleContainer = styled.div<{ iconColor: Color }>`
  display: flex;
  width: 32px;
  height: 32px;
  max-width: 32px;
  max-height: 32px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => themeNames.light[`--accent-${props.iconColor}-secondary`]};
`;

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 8px 0px;
  background: var(--bg-l1-solid);
  border-radius: 20px;
`;

const SettingOptionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 0px 16px;
  box-sizing: border-box;
  width: 100%;
`;

const SettingIconText = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

interface DrawerSettingOptionProps {
  setting: Setting;
  onClick: React.MouseEventHandler;
  isLast: boolean;
}

// default value is not expandable on purpose
const shouldExpand = (settingType = SettingType.Action): boolean => {
  const expandableSettingTypes = [SettingType.Custom, SettingType.Tab];
  return expandableSettingTypes.includes(settingType);
};

const getOnClickAction = (setting: Setting, expandAction: () => void) => {
  if (shouldExpand(setting.type)) return expandAction;
  if (setting.type === SettingType.Action) return setting.onClick;
  if (setting.type === SettingType.Toggle) return setting.onChange;
  return () => undefined;
};

const getInteractivePart = (setting: Setting): ReactElement => {
  switch (setting.type) {
    case SettingType.Toggle:
      return !!setting.loading || !!setting.error ? (
        <CircularProgress spinner />
      ) : (
        <Toggle checked={setting?.checked} dataTest={setting.value} onChange={setting.onChange} />
      );
    case SettingType.Action:
      return <React.Fragment />;
    default:
      return (
        <LowOpacity>
          <Icons color='disabled' icon={Icon.Forward} />
        </LowOpacity>
      );
  }
};

const DrawerSettingOption = forwardRef<HTMLDivElement, DrawerSettingOptionProps>(function DrawerSettingOption(
  { setting, onClick, isLast },
  ref
) {
  return (
    <DrawerOption data-test={setting.dataTest} onClick={onClick} ref={ref}>
      <SettingOptionContainer>
        <SettingIconText>
          {setting.icon && setting.color && (
            <IconCircleContainer iconColor={setting.color}>
              <Icons color={setting.color} icon={setting.icon} size={Size.X_MEDIUM} />
            </IconCircleContainer>
          )}
        </SettingIconText>
        <RightSection $isLast={isLast}>
          <Typography selectable={false} weight={TypographyWeight.MEDIUM}>
            {setting.label}
          </Typography>
          {getInteractivePart(setting)}
        </RightSection>
      </SettingOptionContainer>
    </DrawerOption>
  );
});

const filterTabs = (query: string, allTabs: SettingsTab[]) => {
  const searchQueryRegexp = new RegExp(escapeRegExp(query), 'gi');

  return allTabs.reduce((filteredTabs: SettingsTab[], tab: SettingsTab) => {
    if (tab.label.match(searchQueryRegexp)) return filteredTabs.concat(tab);

    const matchingSettings = tab.settings.filter(
      (setting) => !!setting.label && setting.label.match(searchQueryRegexp)
    );
    return matchingSettings.length !== 0 ? filteredTabs.concat({ ...tab, settings: matchingSettings }) : filteredTabs;
  }, []);
};

export interface SettingsDrawerProps {
  sections: Record<string, SettingsTab[]>;
  open: boolean;
  onClose: () => void;
  theme?: ThemeMode;
  fullsize?: boolean;
  avatarProps: MobileAvatarProps;
  containerId: string;
  initialSettingIndices: SettingIndices;
  onChangeSettingsIndices: (newIndices: SettingIndices) => void;
}

const SettingsDrawer: FC<SettingsDrawerProps> = ({
  open,
  sections,
  onClose,
  avatarProps,
  containerId,
  initialSettingIndices,
  onChangeSettingsIndices,
  fullsize
}) => {
  const { theme } = useTheme();
  const [activeSetting, setActiveSetting] = useState(initialSettingIndices);
  const [settingView, setSettingView] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const allTabs = useMemo(() => {
    return Object.values(sections).reduce(
      (accumulatedTabs: SettingsTab[], tabs: SettingsTab[]) => accumulatedTabs.concat(tabs),
      []
    );
  }, [sections]);

  const settingsToShow = useMemo(() => {
    if (!searchQuery) return allTabs;
    return filterTabs(searchQuery, allTabs);
  }, [searchQuery, allTabs]);

  const settingsElementsRefs = useRef<{ [key in SettingValue]?: HTMLDivElement | undefined }>({});
  const tabsLabelsRefs = useRef<{ [key in TabPage]?: HTMLDivElement | undefined }>({});
  const lastScrollPosition = useRef<number>(0);

  const updateLastScrollPosition = (newPosition = 0) => {
    lastScrollPosition.current = newPosition;
  };

  const scrollToLastPosition = (offset = 0) => {
    document.getElementById(SCROLL_BOX_ID)?.scrollTo({ top: lastScrollPosition.current - offset });
  };

  const hideDrawer = useCallback(() => {
    setSettingView(false);
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const moveToSetting = (newSettingIndecies: SettingIndices) => {
    onChangeSettingsIndices(newSettingIndecies);
    setSettingView(true);
    updateLastScrollPosition(document.getElementById(SCROLL_BOX_ID)?.scrollTop || 0);
  };

  useEffect(() => {
    if (initialSettingIndices.tab !== DEFAULT_MOBILE_SETTINGS_INDICES.tab) {
      if (initialSettingIndices.tab) {
        updateLastScrollPosition(tabsLabelsRefs.current[initialSettingIndices.tab]?.offsetTop);
      }
      scrollToLastPosition(SEARCH_BAR_HEIGHT);
      setActiveSetting(initialSettingIndices);
    }
  }, [initialSettingIndices]);

  const getSectionOfTab = useCallback(
    (tabValue: TabPage) => {
      for (const [sectionIndex, section] of Object.values(sections).entries()) {
        if (section.map((tab: SettingsTab) => tab.value).includes(tabValue)) return Object.keys(sections)[sectionIndex];
      }
    },
    [sections]
  );

  const currentSetting: Setting | undefined = useMemo(
    () =>
      settingsToShow
        .flatMap((tab: SettingsTab) => tab.settings)
        .find((setting: Setting) => setting.value === initialSettingIndices.setting),
    [initialSettingIndices.setting, settingsToShow]
  );

  const tabOpen = !!(settingView && currentSetting);

  const isPlansTabOpen =
    !!(settingView && currentSetting) && currentSetting.label === SETTINGS_LABELS[SettingValue.SubscriptionPlans];

  useEffect(() => {
    if (settingView) return;
    scrollToLastPosition();
  }, [settingView]);

  useEffect(() => {
    if (
      initialSettingIndices.setting != DEFAULT_MOBILE_SETTINGS_INDICES.setting &&
      shouldExpand(currentSetting?.type)
    ) {
      setSettingView(true);
    }
  }, [initialSettingIndices]);

  useEffect(() => {
    const paper = document.getElementById(SETTINGS_PAPER_ID);
    if (!paper) {
      return;
    }
    // allow vertical scrolling on the plans tab
    if (settingView && !isPlansTabOpen) {
      paper.style.overflow = 'hidden';
      return;
    }
    paper.style.overflow = 'auto';
    paper.style.overflowX = 'hidden';
  }, [settingView, isPlansTabOpen]);

  useIosBackdropEffect(open, containerId, SETTINGS_PAPER_ID);

  const settingsList = () => (
    <>
      {!!settingsToShow.length &&
        settingsToShow.map((tab) => (
          <SectionContainer
            key={tab.value}
            ref={(ref) => {
              if (!ref) return;
              tabsLabelsRefs.current[tab.value] = ref;
            }}
          >
            <SettingHeader>
              <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL} uppercase>
                {tab.label}
              </Typography>
            </SettingHeader>
            <ItemsContainer>
              {tab.settings.map((setting, index) => (
                <DrawerSettingOption
                  isLast={index === tab.settings.length - 1}
                  key={setting.value}
                  onClick={getOnClickAction(setting, () =>
                    moveToSetting({
                      tab: tab.value,
                      setting: setting.value,
                      section: getSectionOfTab(tab.value) as SettingsSection
                    })
                  )}
                  ref={(ref) => {
                    if (!ref) return;
                    settingsElementsRefs.current[setting.value] = ref;
                  }}
                  setting={setting}
                />
              ))}
            </ItemsContainer>
          </SectionContainer>
        ))}
      {!settingsToShow.length && (
        <NoResultsContainer>
          <Typography color='secondary'>No results</Typography>
        </NoResultsContainer>
      )}
    </>
  );
  const x = useMotionValue(0);
  const xSingle = useMotionValue(0);

  const onSwipe = (progress: string) => {
    const xProgress = (parseFloat(progress) - 1) * window.screen.width;
    const xSingleProgress = parseFloat(progress) * window.screen.width;
    if (progress === '0' || progress === '1') {
      // In case of touchend / swipe cacnel change value with animate
      animate(x, xProgress);
      animate(xSingle, xSingleProgress);
    } else {
      x.set(xProgress);
      xSingle.set(xSingleProgress);
    }
  };

  return (
    <Drawer
      borderRadius={!!fullsize ? '0px' : undefined}
      extraSpacer={false}
      forceTheme={theme}
      hideDrawer={hideDrawer}
      paperId={SETTINGS_PAPER_ID}
      scrollBoxId={SCROLL_BOX_ID}
      scrollable={!!fullsize}
      show={open}
    >
      <DrawerInnerContainer data-test='settings-drawer' fullsize={!!fullsize}>
        {!fullsize && (
          <MotionDrawerOptions
            animate={tabOpen ? 'open' : 'close'}
            className='mobile-avoiding-keyboard'
            id={SETTING_CONTINER_ID}
            key='all-settings'
            style={{ x, minHeight: '82%', paddingBottom: '36px', gap: '32px' }}
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            variants={{
              open: {
                x: -window.screen.width
              },
              close: {
                x: 0
              }
            }}
          >
            <MobileAvatar {...avatarProps} scrollContainerID={SCROLL_BOX_ID} />
            <SearchContainer>
              <MobileSearch
                disableCancelButton={true}
                disabled={tabOpen}
                initialValue={searchQuery}
                placeHolder='Search'
                setSearchQuery={setSearchQuery}
                showBorder
              />
            </SearchContainer>
            {settingsList()}
          </MotionDrawerOptions>
        )}
        {fullsize && <DrawerOptions>{settingsList()}</DrawerOptions>}
        {tabOpen && (
          <>
            {fullsize && (
              <TabViewContainer style={{ overflowY: isMobile ? 'auto' : undefined }}>
                <SettingTabView
                  fullsize={fullsize}
                  isPlansTab={isPlansTabOpen}
                  onBack={() => {}}
                  onSwipe={() => {}}
                  parentLabel={upperCaseFirstLetter(activeSetting.tab!)}
                  setting={currentSetting}
                />
              </TabViewContainer>
            )}
            {!fullsize && (
              <MotionTabViewContainer
                animate={tabOpen ? 'open' : 'close'}
                id={SINGLE_SETTING_CONTINER_ID}
                initial={{ x: window.screen.width }}
                key='settings-tab-view'
                style={{ x: xSingle, overflowY: isMobile ? 'auto' : undefined }}
                transition={{
                  x: { type: 'spring', stiffness: 350, damping: 30 },
                  delay: 0,
                  duration: 0.2
                }}
                variants={{
                  open: {
                    x: 0
                  },
                  close: {
                    x: window.screen.width
                  }
                }}
              >
                <SettingTabView
                  fullsize={fullsize}
                  isPlansTab={isPlansTabOpen}
                  onBack={() =>
                    setTimeout(() => {
                      setSettingView(false);
                      onChangeSettingsIndices(DEFAULT_MOBILE_SETTINGS_INDICES);
                    }, 0)
                  }
                  onSwipe={onSwipe}
                  parentLabel={upperCaseFirstLetter(activeSetting.tab!)}
                  setting={currentSetting}
                />
              </MotionTabViewContainer>
            )}
          </>
        )}
      </DrawerInnerContainer>
    </Drawer>
  );
};

export default SettingsDrawer;
