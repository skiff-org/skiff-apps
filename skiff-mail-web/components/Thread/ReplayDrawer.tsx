import { partition } from 'lodash';
import { Drawer, IconText } from 'nightwatch-ui';
import { Icon } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { DisplayPictureData, UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDisplayPictureDataFromAddress } from '../../hooks/useDisplayPictureDataFromAddress';
import { ReportOptions } from '../../redux/reducers/mobileDrawerReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

import { EnlargedOption } from './ContactDetails/EnlargedOption';
import { SenderInfo } from './SenderInfo';
import { ThreadBlockOptions, OptionWithSubOption } from './Thread.types';

enum DestructiveLabels {
  Trash = 'Trash'
}

const DrawerOptions = styled.div`
  display: flex;
  flex-direction: column;
`;

const EnlargedOptions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ReplayDrawerContainer = styled.div`
  display: flex;
  padding: 0 4px;
  flex-direction: column;
  gap: 30px;
`;

const DrawerOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-self: flex-end;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
  &:active {
    background: var(--bg-cell-active);
  }

  .dropdownItem {
    // remove right/left padding
    padding: 8px 0;
  }
`;

interface ReplayDrawerProps {
  threadOptions: ThreadBlockOptions[];
  reportSubOptions: ReportOptions;
}

export const ReplayDrawer = ({ threadOptions, reportSubOptions }: ReplayDrawerProps) => {
  const dispatch = useDispatch();
  const hideDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowReplayDrawer(false));
  };

  const show = useAppSelector((state) => state.mobileDrawer.showReplayDrawer);
  const currentEmail = useAppSelector((state) => state.mobileDrawer.currentEmail);
  const displayPictureData = useDisplayPictureDataFromAddress(currentEmail?.from.address);

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

  return (
    <Drawer hideDrawer={hideDrawer} noSelect show={show}>
      <ReplayDrawerContainer>
        <SenderInfo
          displayName={currentEmail.from.name || currentEmail.from.address.split('@')[0]} // if no name, use the email's username
          displayPicturData={displayPictureData as DisplayPictureData}
          emailAlias={currentEmail.from.address}
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
              <IconText key={option.label} label={option.label} level={1} startIcon={option.icon} type='paragraph' />
            </DrawerOption>
          ))}
        </DrawerOptions>
      </ReplayDrawerContainer>
    </Drawer>
  );
};
