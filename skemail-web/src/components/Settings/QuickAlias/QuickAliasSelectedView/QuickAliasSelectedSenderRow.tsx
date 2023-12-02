import { Dropdown, DropdownItem, Icon, IconText, Typography, TypographySize } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UserAvatar } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { MailboxSearchFilter, MailboxSearchFilterType } from '../../../../utils/search/searchTypes';
import { useSearch } from '../../../../utils/search/useSearch';
import { ConfirmSilencingModal } from '../../../shared/Silencing';
import { useSettings } from '../../useSettings';

const SenderRow = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
`;

const SenderAvatarName = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SenderName = styled.div`
  display: flex;
  flex-direction: column;
`;

interface QuickAliasSelectedSenderRowProps {
  sender: AddressObject;
}

export default function QuickAliasSelectedSenderRow(props: QuickAliasSelectedSenderRowProps) {
  const { sender } = props;
  const { name, address } = sender;

  const dispatch = useDispatch();
  const closeOpenModal = () => dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  const { searchInSearchRoute } = useSearch();
  const { closeSettings } = useSettings();

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const [confirmSilencingModalOpen, setConfirmSilencingModalOpen] = useState(false);

  const viewMail = () => {
    const addressFilter: MailboxSearchFilter = {
      type: MailboxSearchFilterType.FROM,
      addressObj: { address: address }
    };
    searchInSearchRoute('', [addressFilter]);
    setShowMoreOptions(false);
    closeOpenModal();
    closeSettings();
  };

  return (
    <SenderRow>
      <SenderAvatarName>
        <UserAvatar label={name || address} />
        <SenderName>
          <Typography color='secondary' size={TypographySize.SMALL}>
            {name || address}
          </Typography>
          {!!name && (
            <Typography color='disabled' size={TypographySize.SMALL}>
              {address}
            </Typography>
          )}
        </SenderName>
      </SenderAvatarName>
      <IconText
        color='secondary'
        onClick={() => setShowMoreOptions(true)}
        ref={overflowRef}
        startIcon={Icon.OverflowH}
      />
      <Dropdown buttonRef={overflowRef} portal setShowDropdown={setShowMoreOptions} showDropdown={showMoreOptions}>
        <DropdownItem icon={Icon.EnvelopeRead} label='View mail from sender' onClick={viewMail} />
        <DropdownItem
          icon={Icon.SoundSlash}
          label='Silence sender'
          onClick={() => {
            setShowMoreOptions(false);
            setConfirmSilencingModalOpen(true);
          }}
        />
      </Dropdown>
      <ConfirmSilencingModal
        addressesToSilence={[address]}
        onClose={() => {
          setConfirmSilencingModalOpen(false);
        }}
        open={confirmSilencingModalOpen}
      />
    </SenderRow>
  );
}
