import { partition } from 'lodash';
import { Divider, IconText, Drawer } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { DrawerOption, DrawerOptions } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { ReportOptions, skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';

import { EnlargedOption } from './ContactDetails/EnlargedOption';
import { ThreadBlockOptions, OptionWithSubOption } from './Thread.types';

interface MobileMoreThreadOptionsDrawerProps {
  emailID: string;
  threadOptions: ThreadBlockOptions[];
  reportSubOptions: ReportOptions;
}

const MobileActionsContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 12px 0;
  flex-wrap: wrap;
  justify-content: space-around;
  width: 100%;
`;

export const MobileMoreThreadOptionsDrawer: React.FC<MobileMoreThreadOptionsDrawerProps> = ({
  emailID,
  threadOptions,
  reportSubOptions
}) => {
  const dispatch = useDispatch();

  // Open drawer state -> gets updated from MobileThreadHeader and SenderDetails
  const { open: drawerOpen, emailSpecific } = useAppSelector((state) => state.mobileDrawer.showMoreThreadOptionsDrawer);

  // Current selected email state
  const currentEmail = useAppSelector((state) => state.mobileDrawer.currentEmail);

  // Show report block thread drawer
  const showReportDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowReportThreadBlockDrawer(true));
  };

  // Hide current drawer
  const hideDrawer = () => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMoreThreadOptionsDrawer({ open: false, emailSpecific }));
  };

  // Sets report options
  const setReportSubOptions = () => {
    dispatch(skemailMobileDrawerReducer.actions.setReportThreadBlockOptions(reportSubOptions));
  };

  // If we are showing email specific options, filter out the non email specific ones

  const options = [...threadOptions].filter((option) =>
    emailSpecific ? option.emailSpecific !== false : !option.emailSpecific
  );

  // Split up the button actions from the list/DrawerOption actions
  const [actionButtonOptions, listActionOptions] = partition(options, (option) => option.isMobileActionButton);

  // If current email is not the same as the email prop do not open drawer
  if (isMobile && currentEmail && emailID !== currentEmail.id) {
    return null;
  }

  const createMobileActions = () => (
    // Top Actions (Reply Forward ReplyAll)
    <MobileActionsContainer>
      {actionButtonOptions.map((action) => {
        return <EnlargedOption key={action.label} option={action} />;
      })}
    </MobileActionsContainer>
  );

  const mobileOptionsToItem = (option) => {
    if (option.subOptions) {
      // Move thread button
      return (
        <DrawerOption
          key={option.label}
          onClick={() => {
            // Sub-option drawers must replace current drawer
            hideDrawer();
            if (option.label === OptionWithSubOption.Report) {
              setReportSubOptions();
              showReportDrawer(); // Show report thread block drawer
            }
          }}
        >
          <IconText key={option.label} label={option.label} level={1} startIcon={option.icon} type='paragraph' />
        </DrawerOption>
      );
    }
    return (
      <DrawerOption
        key={option.label}
        onClick={() => {
          hideDrawer();
          option.onClick();
        }}
      >
        <IconText key={option.label} label={option.label} level={1} startIcon={option.icon} type='paragraph' />
      </DrawerOption>
    );
  };

  return (
    <Drawer hideDrawer={hideDrawer} show={drawerOpen}>
      <DrawerOptions>
        {!!actionButtonOptions.length && (
          <>
            {createMobileActions()}
            <Divider style={{ margin: '8px 0' }} />
          </>
        )}
        {listActionOptions.map(mobileOptionsToItem)}
      </DrawerOptions>
    </Drawer>
  );
};
