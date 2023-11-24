import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon, Icons, ThemeMode, Typography, getThemedColor } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { AccountProvisioning } from 'skiff-utils';
import styled from 'styled-components';
import { useGetFF } from '../../..';

const OptionContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: ${isMobile ? 'flex-start' : 'center'};
  padding: 16px;

  width: 100%;
  height: ${isMobile ? 'fit-content' : '75px'};

  background: ${isMobile ? getThemedColor('var(--bg-l3-solid)', ThemeMode.DARK) : 'var(--bg-l3-solid)'};
  border: 1px solid ${isMobile ? getThemedColor('var(--border-secondary)', ThemeMode.DARK) : 'var(--border-secondary)'};
  border-radius: 8px;

  &:hover {
    background: var(--bg-overlay-tertiary);
    cursor: pointer;
  }
  margin-top: ${isMobile ? '16px' : '0px'};
`;

const OptionContainerText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
`;

interface SelectInviteOptionProps {
  onClickSendInvite: () => void;
  onClickProvisionUser: () => void;
}

const SelectInviteOption: React.FC<SelectInviteOptionProps> = ({ onClickSendInvite, onClickProvisionUser }) => {
  const flags = useFlags();
  const isProvisioningEnabled = useGetFF<AccountProvisioning>('accountProvisioning');

  return (
    <>
      <OptionContainer onClick={onClickSendInvite}>
        <OptionContainerText>
          <Typography color='primary' forceTheme={isMobile ? ThemeMode.DARK : undefined}>
            Send an invite
          </Typography>
          <Typography color='secondary' forceTheme={isMobile ? ThemeMode.DARK : undefined} wrap>
            Allow new member to set up their own account
          </Typography>
        </OptionContainerText>
        <Icons color='disabled' forceTheme={isMobile ? ThemeMode.DARK : undefined} icon={Icon.ChevronRight} />
      </OptionContainer>
      {isProvisioningEnabled && (
        <OptionContainer onClick={onClickProvisionUser}>
          <OptionContainerText>
            <Typography color='primary' forceTheme={isMobile ? ThemeMode.DARK : undefined}>
              Provision an account
            </Typography>

            <Typography color='secondary' forceTheme={isMobile ? ThemeMode.DARK : undefined} wrap>
              Create an alias and password for new member
            </Typography>
          </OptionContainerText>

          <Icons color='disabled' forceTheme={isMobile ? ThemeMode.DARK : undefined} icon={Icon.ChevronRight} />
        </OptionContainer>
      )}
    </>
  );
};

export default SelectInviteOption;
