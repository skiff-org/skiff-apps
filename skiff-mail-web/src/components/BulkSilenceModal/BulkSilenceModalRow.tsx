import { Dropdown, DropdownItem, FilledVariant, Icon, IconText, MonoTag, Size, Type, Typography } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Checkbox, UserAvatar } from 'skiff-front-utils';
import { SilenceSenderBulkSuggestion } from 'skiff-graphql';
import styled from 'styled-components';

import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { MailboxSearchFilter, MailboxSearchFilterType } from '../../utils/search/searchTypes';
import { useSearch } from '../../utils/search/useSearch';
import { useSettings } from '../Settings/useSettings';
import {
  ConfirmUpdateNotificationsForSenderModal,
  ConfirmSilencingModal,
  NotificationsForSenderState
} from '../shared/Silencing';
import { ConfirmNotNoiseModal } from '../shared/Silencing/ConfirmNotNoiseModal';

import { WARN_EMAIL_CUTOFF } from './BulkSilenceModal.constants';
import { CheckboxContainer, OneThirdCol, TwoThirdCol } from './BulkSilenceModal.styles';

type BulkSilenceModalRowProps = {
  indentation: number;
  emailAddress: string;
  messageCount: number;
  isLast?: boolean;
  checked?: boolean;
  onClick?: () => void;
  displayName?: string;
  domainSenders?: Array<SilenceSenderBulkSuggestion>;
  onExpand?: () => void;
  expanded?: boolean;
};

const RowContainer = styled.div<{ $indentation: number; $isLast?: boolean }>`
  display: flex;
  padding: 16px 12px;
  height: 60px;
  border-bottom: ${({ $isLast }) => ($isLast ? 'none' : '1px solid var(--border-tertiary)')};
  gap: 12px;
  box-sizing: border-box;
  justify-content: space-between;
  cursor: pointer;
  :hover {
    background: var(--bg-overlay-quaternary);
  }
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SenderName = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

/**
 * Component for a single row in the bulk unsubscribe modal.
 */
const BulkSilenceModalRow: React.FC<BulkSilenceModalRowProps> = ({
  indentation,
  emailAddress,
  messageCount,
  displayName,
  checked,
  onClick,
  domainSenders,
  isLast,
  onExpand,
  expanded
}: BulkSilenceModalRowProps) => {
  const overflowRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const [confirmNotNoiseOpen, setConfirmNotNoiseOpen] = useState(false);
  const [confirmHideNotificationsOpen, setConfirmHideNotificationsOpen] = useState(false);
  const [openMoreDropdown, setOpenMoreDropdown] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const closeOpenModal = () => dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  const { closeSettings } = useSettings();

  const { searchInSearchRoute } = useSearch();

  const onCloseConfirmBlockModal = () => setConfirmBlockOpen(false);
  const isParent = domainSenders && domainSenders.length > 0;
  const checkboxOnClick = (e: React.MouseEvent) => {
    if (isParent) {
      e.stopPropagation();
      if (onClick) {
        onClick();
      }
    }
  };

  const isMarkNotNoise = checked !== undefined;

  return (
    <RowContainer $indentation={indentation} $isLast={isLast} onClick={onClick}>
      <TwoThirdCol $paddingLeft={indentation > 0 ? 12 + indentation * 24 : undefined}>
        {checked !== undefined && (
          <CheckboxContainer onClick={checkboxOnClick}>
            <Checkbox checked={checked} onClick={checkboxOnClick} />
          </CheckboxContainer>
        )}
        <UserAvatar label={displayName || emailAddress} size={Size.X_MEDIUM} />
        <SenderName>
          <Typography selectable={false}>{displayName || emailAddress}</Typography>
          {!!displayName && (
            <Typography color='secondary' selectable={false}>
              {emailAddress}
            </Typography>
          )}
        </SenderName>
      </TwoThirdCol>
      <OneThirdCol>
        <MonoTag color={messageCount > WARN_EMAIL_CUTOFF ? 'orange' : 'secondary'} label={`${messageCount}`} />
      </OneThirdCol>
      <OneThirdCol>
        <ButtonGroup>
          <IconText
            color={Type.SECONDARY}
            onClick={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              setOpenMoreDropdown(true);
            }}
            ref={overflowRef}
            startIcon={Icon.OverflowH}
          />
          {isParent && (
            <IconText
              color={Type.SECONDARY}
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                if (onExpand) onExpand();
              }}
              size={Size.SMALL}
              startIcon={expanded ? Icon.ChevronDown : Icon.ChevronRight}
              variant={FilledVariant.UNFILLED}
            />
          )}
        </ButtonGroup>
        <Dropdown
          buttonRef={overflowRef}
          gapFromAnchor={6}
          minWidth={175}
          portal
          setShowDropdown={setOpenMoreDropdown}
          showDropdown={openMoreDropdown}
        >
          <DropdownItem
            icon={Icon.CheckCircle}
            label={checked !== undefined ? 'Allow sender' : 'Unsilence sender'} // checked not defined if already silenced
            onClick={() => {
              setConfirmNotNoiseOpen(true);
              setOpenMoreDropdown(false);
            }}
          />
          {!isParent && ( // TODO: view  all senders in domain
            <DropdownItem
              icon={Icon.EnvelopeUnread}
              label='View recent mail'
              onClick={() => {
                const addressFilter: MailboxSearchFilter = {
                  type: MailboxSearchFilterType.FROM,
                  addressObj: { address: emailAddress }
                };
                // search without a query to match on the address filter alone
                searchInSearchRoute('', [addressFilter]);
                setOpenMoreDropdown(false);
                closeOpenModal();
                closeSettings();
              }}
            />
          )}
          {isMarkNotNoise && (
            <DropdownItem
              icon={Icon.BellSlash}
              label='Turn off notifications'
              onClick={() => {
                setConfirmHideNotificationsOpen(true);
                setOpenMoreDropdown(false);
              }}
            />
          )}
          {checked !== undefined && (
            <DropdownItem
              color='destructive'
              icon={Icon.Spam}
              label={`Silence ${isParent ? `all ${domainSenders.length} senders` : 'sender'}`}
              onClick={() => {
                setConfirmBlockOpen(true);
                setOpenMoreDropdown(false);
              }}
            />
          )}
        </Dropdown>
        <ConfirmSilencingModal
          addressesToSilence={isParent ? domainSenders?.map((child) => child.sender) : [emailAddress]}
          onClose={onCloseConfirmBlockModal}
          open={confirmBlockOpen}
        />
        <ConfirmNotNoiseModal
          confirmNotNoiseOpen={confirmNotNoiseOpen}
          domainSenders={domainSenders}
          emailAddress={emailAddress}
          isMarkNotNoise={isMarkNotNoise}
          isParent={isParent}
          setConfirmNotNoiseOpen={setConfirmNotNoiseOpen}
        />
        <ConfirmUpdateNotificationsForSenderModal
          confirmHideNotificationsOpen={confirmHideNotificationsOpen}
          emailAddresses={isParent ? domainSenders.map((suggestion) => suggestion.sender) : [emailAddress]}
          setConfirmHideNotificationsOpen={setConfirmHideNotificationsOpen}
          state={NotificationsForSenderState.OFF}
        />
      </OneThirdCol>
    </RowContainer>
  );
};

export default BulkSilenceModalRow;
