import {
  Alignment,
  Dialog,
  DialogTypes,
  Divider,
  IconText,
  Size,
  Surface,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import { FC, useEffect, useMemo, useState } from 'react';
import { DisplayPictureData, useUserProfile } from 'skiff-front-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/localState';
import { useDefaultEmailAlias } from '../../hooks';
import { getDisplayPictureDataFromUser } from '../../utils';
import { Sidebar, SidebarSectionProps } from '../Sidebar';
import { UserAvatar } from '../UserAvatar';

import {
  DEFAULT_WEB_SETTING_INDICES,
  Setting,
  SettingIndices,
  SETTINGS_TABS_LABELS,
  SettingsSection,
  SettingsTab,
  SettingType,
  TabPage
} from './Settings.types';
import TitleActionSection from './TitleActionSection';

const SidebarView = styled.div`
  display: flex;
  height: 70vh;
  min-height: 500px;
  width: 100%;
  background: var(--bg-l2-solid);
  border-radius: 12px;
  overflow: hidden;
`;

const View = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  width: 100%;
  gap: 16px;
  padding: 28px;
  flex: 1;
  align-self: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
`;

const SidebarLabel = styled.div<{ active?: boolean }>`
  padding: 6px 6px 6px 8px;
  margin: 0 4px;
  gap: 8px;
  height: 32px;
  border-radius: 6px;
  box-sizing: border-box;
  align-items: center;
  display: flex;
  position: relative;
  justify-content: space-between;
  border: 1px solid transparent;
  background: ${(props) => (props.active ? 'var(--bg-overlay-tertiary)' : '')};
  &:hover {
    background-color: var(--bg-overlay-tertiary);
    cursor: pointer;
  }
`;

const LabelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: auto;
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
`;

const ItemContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const DividerContainer = styled.div<{ $fullHeight?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20px;

  ${(props) => props.$fullHeight && 'height: 100%;'}
`;

const AccountButton = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 6px;
  margin: 4px;
  margin-bottom: 0px;
  ${(props) => (props.$active ? 'background: var(--bg-overlay-tertiary);' : '')}
  ${(props) =>
    !props.$active &&
    css`
      &:hover {
        background-color: var(--bg-overlay-tertiary);
        cursor: pointer;
      }
    `}
`;

const AccountName = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TIMEOUT_DURATION = 250;

interface SettingViewProps {
  setting: Setting;
  index: number;
}

const EXCLUDE_TITLE: Array<TabPage | undefined> = [
  TabPage.Empty,
  TabPage.Account,
  TabPage.Plans,
  TabPage.Contacts,
  TabPage.CustomDomains,
  TabPage.Org,
  TabPage.Filters
];

const SettingView: FC<SettingViewProps> = ({ setting, index }) => {
  switch (setting.type) {
    case SettingType.Toggle:
      return (
        <DividerContainer>
          {index !== 0 && <Divider color='tertiary' />}
          <TitleActionSection
            actions={[
              {
                dataTest: setting.value,
                onChange: setting.onChange,
                checked: setting.checked,
                type: 'toggle',
                loading: setting.loading,
                error: setting.error
              }
            ]}
            subtitle={setting.description}
            title={setting.label}
          />
        </DividerContainer>
      );
    case SettingType.Tab:
      return (
        <Surface size='full-width'>
          {setting.label && <IconText label={setting.label} startIcon={setting.icon} />}
          {setting.description && <Typography color='secondary'>{setting.description}</Typography>}
          {setting.component}
        </Surface>
      );
    case SettingType.Action:
      return null;
    case SettingType.Custom:
    default:
      return (
        <DividerContainer $fullHeight={setting.fullHeight}>
          {index !== 0 && <Divider color='tertiary' />}
          {setting.component}
        </DividerContainer>
      );
  }
};

export interface SettingsModalProps {
  sections: Record<string, SettingsTab[]>;
  open: boolean;
  onClose: () => void;
  /** Set the initial section/page we land on when the modal opens  */
  initialIndices?: SettingIndices;
  /** Handler for when the user changes the current section/page */
  onChangeIndices?: (indices: SettingIndices) => void;
  theme?: ThemeMode;
}

export const SettingsModal = ({ sections, open, onClose, onChangeIndices, initialIndices }: SettingsModalProps) => {
  const indices = initialIndices ?? DEFAULT_WEB_SETTING_INDICES;
  const [activeTab, setActiveTab] = useState<SettingIndices>(indices);
  const { userID } = useRequiredCurrentUserData();
  const { data: userProfileData, loading } = useUserProfile(userID);
  const displayPictureData = getDisplayPictureDataFromUser(userProfileData);
  const [defaultEmailAlias] = useDefaultEmailAlias(userID);
  const displayName = loading ? undefined : userProfileData?.publicData.displayName;

  const settingsToDisplay = useMemo<Setting[]>(() => {
    const initialSection = indices.section ?? DEFAULT_WEB_SETTING_INDICES.section;
    const defaultSettingsToDisplay = sections[initialSection][0].settings;

    if (!activeTab.section) return defaultSettingsToDisplay;

    const currentSection: SettingsTab[] = sections[activeTab.section];

    return (
      currentSection.find((currentTab: SettingsTab) => currentTab.value === activeTab.tab)?.settings ||
      defaultSettingsToDisplay
    );
  }, [activeTab.section, activeTab.tab, sections, indices]);

  useEffect(() => {
    if (initialIndices) {
      setActiveTab(initialIndices);
    }
  }, [initialIndices]);

  const name = displayName || defaultEmailAlias || userProfileData?.username || '';

  const fileTree: SidebarSectionProps[] = [
    {
      id: 'file-tree-section',
      isCustom: true,
      content: (
        <>
          <AccountButton
            $active={activeTab.tab === TabPage.Account}
            key={TabPage.Account}
            onClick={() => {
              const tabIndices = {
                tab: TabPage.Account,
                section: SETTINGS_TABS_LABELS[TabPage.Account] as SettingsSection
              };
              if (onChangeIndices) {
                onChangeIndices(tabIndices);
              }
            }}
          >
            <UserAvatar
              displayPictureData={displayPictureData as DisplayPictureData | null}
              label={name}
              size={Size.LARGE}
              style={{ border: '1px solid var(--border-secondary)', borderRadius: '8px', overflow: 'hidden' }}
            />
            <AccountName>
              <Typography maxWidth='160px'>{name}</Typography>
              {displayName && (
                <Typography color='disabled' maxWidth='160px' size={TypographySize.SMALL}>
                  {defaultEmailAlias || userProfileData?.username}
                </Typography>
              )}
            </AccountName>
          </AccountButton>
          {Object.entries(sections).map((section) => {
            const [label, tabs] = section;
            return (
              <>
                <ItemContainer key={label}>
                  <TitleBlock>
                    <Typography color='disabled' mono size={TypographySize.SMALL} weight={TypographyWeight.MEDIUM}>
                      {label.toUpperCase()}
                    </Typography>
                  </TitleBlock>
                  <LabelList>
                    {/* System Labels */}
                    {tabs
                      .filter((tab) => !tab?.hideTab)
                      .map((tab) => {
                        const active = activeTab.tab === tab.value && activeTab.section === label;
                        return (
                          <SidebarLabel
                            // Section value and labels are equal
                            active={active}
                            key={tab.value}
                            onClick={() => {
                              const tabIndices = { tab: tab.value, section: label as SettingsSection };
                              if (onChangeIndices) {
                                onChangeIndices(tabIndices);
                              }
                            }}
                          >
                            <IconText
                              color={active ? 'primary' : 'secondary'}
                              label={tab.label}
                              startIcon={tab.icon}
                              weight={TypographyWeight.REGULAR}
                            />
                          </SidebarLabel>
                        );
                      })}
                  </LabelList>
                </ItemContainer>
              </>
            );
          })}
        </>
      )
    }
  ];

  return (
    <Dialog
      customContent
      dataTest='settings-modal'
      onClose={onClose}
      open={open}
      padding={false}
      type={DialogTypes.Settings}
    >
      <SidebarView>
        <Sidebar sections={fileTree} width={240} />
        <View>
          {!EXCLUDE_TITLE.includes(activeTab.tab) && activeTab.tab !== TabPage.Empty && !!activeTab.tab && (
            <Typography align={Alignment.LEFT} size={TypographySize.H4} weight={TypographyWeight.BOLD}>
              {upperCaseFirstLetter(SETTINGS_TABS_LABELS[activeTab.tab])}
            </Typography>
          )}
          {settingsToDisplay &&
            settingsToDisplay.map((setting: Setting, index: number) => (
              <SettingView index={index} key={setting.value} setting={setting} />
            ))}
        </View>
      </SidebarView>
    </Dialog>
  );
};
