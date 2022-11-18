import { Chip, Icon, IconButton, Icons, Tooltip, Typography } from 'nightwatch-ui';
import React, { RefObject, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  abbreviateWalletAddress,
  getAddrDisplayName,
  getAddressTooltipLabel,
  getWalletIcon,
  isWalletAddress,
  splitEmailToAliasAndDomain,
  UserAvatar
} from 'skiff-front-utils';
import { isENSName } from 'skiff-utils';
import styled from 'styled-components';

import { useDate } from '../../../hooks/useDate';
import { useDisplayPictureDataFromAddress } from '../../../hooks/useDisplayPictureDataFromAddress';
import { MailboxEmailInfo } from '../../../models/email';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { getWalletLookUpText, openWalletLookupLink } from '../../../utils/walletUtils/walletUtils';

import ContactActionDropdown from './ContactActionDropdown';

const SenderBlock = styled.div`
  display: flex;
  align-items: ${isMobile ? 'flex-start' : 'center'};
  gap: 16px;
`;

const AvatarBlock = styled(UserAvatar)`
  margin-top: 6px;
`;

const InlineTypography = styled(Typography)<{ isWalletAddress: boolean; renderLinkIcon: boolean }>`
  display: inline-flex;
  ${(props) => {
    if (props.isWalletAddress) {
      return `margin-right: ${props.renderLinkIcon ? '4px' : '8px'};`;
    }
  }};
`;

const Email = styled.div`
  margin-top: ${isMobile ? '-8px' : ''};
  padding: ${isMobile ? '11px 0px 22px 0px' : ''};
`;

const FromAndDateContainer = styled.div<{ isWalletAddress: boolean; renderLinkIcon: boolean }>`
  width: 100%;
  display: flex;
  ${(props) => {
    if (props.isWalletAddress) {
      return `
        align-items: center;
        flex-wrap: ${!props.renderLinkIcon ? 'wrap' : 'no-wrap'};
      `;
    }
    return 'flex-direction: column;';
  }}
  min-width: 0;
`;

const ThreadActionButtonContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const HeaderDate = styled(Typography)`
  min-width: fit-content;
`;

const NameAndDate = styled.div<{ $isWalletEmail: boolean; $renderDisplayName: boolean }>`
  width: ${(props) => (isMobile && props.$isWalletEmail && !props.$renderDisplayName ? '90%' : '100%')};
  height: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Name = styled.span`
  max-width: 68%;
`;

interface SenderDetailsProps {
  email: MailboxEmailInfo;
  showContacts: boolean;
  expanded: boolean;
  moreButtonRef: RefObject<HTMLDivElement>;
  setShowMoreOptions: (showMoreOptions: boolean) => void;
}

export const SenderDetailsDataTest = {
  externalLinkBtn: 'external-link-btn'
};

export const SenderDetails: React.FC<SenderDetailsProps> = ({
  email,
  showContacts,
  expanded,
  moreButtonRef,
  setShowMoreOptions
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { from, createdAt } = email;
  const createdAtDate = createdAt as Date;
  const { address: fromAddress, name: fromDisplayName } = email.from;

  const [showFromContactDropdown, setShowFromContactDropdown] = useState<boolean>(false);

  const fromContactRef = useRef<HTMLDivElement>(null);
  const { getMonthAndDay, getTime } = useDate();

  const [fromAlias] = splitEmailToAliasAndDomain(fromAddress);
  const isWalletEmail = isWalletAddress(fromAlias) || isENSName(fromAlias);
  const displayPictureData = useDisplayPictureDataFromAddress(fromAddress);

  // redux actions
  const dispatch = useDispatch();
  const setCurrentEmail = (currEmail: MailboxEmailInfo) =>
    dispatch(skemailMobileDrawerReducer.actions.setCurrentEmail(currEmail));
  const openShowMoreOptionsDrawer = () =>
    dispatch(skemailMobileDrawerReducer.actions.setShowMoreThreadOptionsDrawer({ open: true, emailSpecific: true }));

  const renderDateAndActionsButton = () => (
    <ThreadActionButtonContainer>
      <HeaderDate color='tertiary' level={3}>
        {isMobile ? getMonthAndDay(createdAtDate) : `${getMonthAndDay(createdAtDate)}, ${getTime(createdAtDate)}`}
      </HeaderDate>
      {expanded && (
        <IconButton
          color='secondary'
          icon={Icon.OverflowH}
          onClick={(e) => {
            e.stopPropagation();
            if (isMobile) {
              // set the email in the more options drawer to the current email
              setCurrentEmail(email);
              // open drawer
              openShowMoreOptionsDrawer();
            } else {
              // open dropdown
              setShowMoreOptions(true);
            }
          }}
          ref={moreButtonRef}
        />
      )}
    </ThreadActionButtonContainer>
  );

  // render the address as the display name if the user has not specified a display name
  const { displayName, formattedDisplayName } = getAddrDisplayName(email.from);

  const renderNameAndDate = () => {
    return (
      <NameAndDate $isWalletEmail={isWalletEmail} $renderDisplayName={!!fromDisplayName}>
        <Name ref={fromContactRef}>
          <Tooltip direction='top' hidden={!!fromDisplayName} label={getAddressTooltipLabel(fromAddress)}>
            <div>
              <InlineTypography
                color={showContacts ? 'link' : 'primary'}
                isWalletAddress={isWalletEmail}
                onClick={showContacts ? () => setShowFromContactDropdown((prev) => !prev) : undefined}
                renderLinkIcon={isWalletEmail && !fromDisplayName}
                type='label'
              >
                {formattedDisplayName}
              </InlineTypography>
            </div>
          </Tooltip>
          <ContactActionDropdown
            address={from}
            buttonRef={fromContactRef}
            displayAddress
            setShowActionDropdown={setShowFromContactDropdown}
            show={showFromContactDropdown}
          />
        </Name>
        {renderDateAndActionsButton()}
      </NameAndDate>
    );
  };

  const renderAddress = () => {
    if (isWalletEmail) {
      const walletLookUpTooltip = getWalletLookUpText(fromAlias);
      const openWalletLookupPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        openWalletLookupLink(fromAlias);
      };
      if (!fromDisplayName) {
        return (
          <IconButton
            color='secondary'
            dataTest={SenderDetailsDataTest.externalLinkBtn}
            icon={Icon.ExternalLink}
            onClick={openWalletLookupPage}
            tooltip={walletLookUpTooltip}
          />
        );
      }

      const getWalletChipLabel = () => {
        if (!fromDisplayName) return getWalletLookUpText(fromAlias);
        return isENSName(fromAlias) ? fromAlias : `${abbreviateWalletAddress(fromAlias)}`;
      };
      const chipLabel = getWalletChipLabel();
      const walletIcon = getWalletIcon(fromAlias);
      return (
        <Chip
          endIcon={<Icons color='secondary' icon={Icon.ExternalLink} size='medium' />}
          label={chipLabel}
          onClick={openWalletLookupPage}
          size='small'
          startIcon={walletIcon}
          tooltip={walletLookUpTooltip}
        />
      );
    }
    if (fromDisplayName) {
      return (
        <Email>
          <InlineTypography color='secondary' isWalletAddress={false} renderLinkIcon={false} type='paragraph'>
            &lt;{fromAddress}&gt;
          </InlineTypography>
        </Email>
      );
    }
  };

  const [displayNameAlias] = splitEmailToAliasAndDomain(displayName);

  return (
    <SenderBlock>
      <AvatarBlock displayPictureData={displayPictureData} label={displayNameAlias} size='large' />
      <FromAndDateContainer isWalletAddress={isWalletEmail} renderLinkIcon={isWalletEmail && !fromDisplayName}>
        {renderNameAndDate()}
        {renderAddress()}
      </FromAndDateContainer>
    </SenderBlock>
  );
};
