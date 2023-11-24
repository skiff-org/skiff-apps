import partition from 'lodash/partition';
import { DropdownItem, Icon, ThemeMode } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { Drawer, DrawerOption, DrawerOptions, splitEmailToAliasAndDomain } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDisplayPictureWithDefaultFallback } from '../../hooks/useDisplayPictureDataFromAddress';
import { ReportOptions, skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

import { EnlargedOption } from './ContactDetails/EnlargedOption';
import { SenderInfo } from './SenderInfo';
import { OptionWithSubOption, ThreadBlockOptions } from './Thread.types';

enum DestructiveLabels {
  Trash = 'Trash'
}

const EnlargedOptions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const ReplyDrawerContainer = styled.div`
  display: flex;
  padding: 0 4px;
  flex-direction: column;
  gap: 30px;
`;

interface ReplyDrawerProps {
  threadOptions: ThreadBlockOptions[];
  reportSubOptions: ReportOptions;
}

export const ReplyDrawer = ({ threadOptions, reportSubOptions }: ReplyDrawerProps) => {
  const dispatch = useDispatch();
  const hideDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowReplyDrawer(false));
  };

  const show = useAppSelector((state) => state.mobileDrawer.showReplyDrawer);
  const currentEmail = useAppSelector((state) => state.mobileDrawer.currentEmail);

  const messageID = currentEmail?.id;
  const { displayPictureData, unverified } = useDisplayPictureWithDefaultFallback(
    currentEmail?.from.address,
    messageID
  );

  // Sets report options
  const setReportSubOptions = () => {
    dispatch(skemailMobileDrawerReducer.actions.setReportThreadBlockOptions(reportSubOptions));
  };
  const showReportDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowReportThreadBlockDrawer(true));
  };
  const showMoveToDrawer = () => {
    hideDrawer();
    dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Folder));
  };

  const [enlargedOptions, simpleOptions] = partition(
    [
      ...threadOptions,
      {
        label: 'Move to folder',
        icon: Icon.FolderArrow,
        onClick: showMoveToDrawer
      }
    ],
    (threadOption) => threadOption.isMobileActionButton
  );
  if (!currentEmail) {
    return null;
  }

  const { alias: fromAlias } = splitEmailToAliasAndDomain(currentEmail.from.address);

  return (
    <Drawer hideDrawer={hideDrawer} selectable={false} show={show}>
      <ReplyDrawerContainer>
        <SenderInfo
          displayName={currentEmail.from.name || fromAlias} // if no name, use the email's username
          displayPictureData={{
            profileCustomURI: displayPictureData.profileCustomURI,
            profileAccentColor: displayPictureData.profileAccentColor,
            profileIcon: displayPictureData.profileIcon
          }}
          emailAlias={currentEmail.from.address}
          forceTheme={ThemeMode.DARK}
          unverified={unverified}
        />
        <EnlargedOptions>
          {enlargedOptions.map((option) => (
            <EnlargedOption
              destructive={option.label in DestructiveLabels}
              hideDrawer={hideDrawer}
              key={option.label}
              option={option}
            />
          ))}
        </EnlargedOptions>
        <DrawerOptions>
          {simpleOptions.map((option) => (
            <DrawerOption
              key={option.label}
              onClick={() => {
                // Sub-option drawers must replace current drawer
                hideDrawer();
                if (option.label === OptionWithSubOption.Report) {
                  setReportSubOptions();
                  showReportDrawer(); // Show report thread block drawer
                  return;
                }
                if (option.onClick) {
                  option.onClick();
                }
              }}
            >
              <DropdownItem icon={option.icon} key={option.label} label={option.label} />
            </DrawerOption>
          ))}
        </DrawerOptions>
      </ReplyDrawerContainer>
    </Drawer>
  );
};
