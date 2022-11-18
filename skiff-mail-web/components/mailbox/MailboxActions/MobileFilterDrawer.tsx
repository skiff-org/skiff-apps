import { Drawer, Icon, Icons, Typography } from 'nightwatch-ui';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DrawerBlocksContainer } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';

import { MailboxFilters } from './MailboxActions';

const DrawerOptionsContentContainer = styled.div`
  display: flex;
  flex-direction: column;

  padding: 0 16px;
`;

const DrawerBlockContainer = styled.div<{ active?: boolean }>`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 88px;
  gap: 10px;
  border: 1px solid ${(props) => (props.active ? 'var(--border-active)' : 'var(--border-secondary)')};
  border-radius: 12px;
`;

const ScaledIcon = styled(Icons)`
  transform: scale(1.5) !important;
`;

const CheckedIndicator = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  background-color: var(--icon-link);
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  border: 2px solid var(--bg-l3-solid);
`;
interface DrawerBlockProps {
  icon: Icon;
  label: string;
  active?: boolean;
  onClick: () => void;
}
const DrawerBlock = ({ icon, label, active, onClick }: DrawerBlockProps) => {
  return (
    <DrawerBlockContainer active={active} onClick={onClick}>
      {active && (
        <CheckedIndicator>
          <Icons color='white' icon={Icon.Check} size='xsmall' />
        </CheckedIndicator>
      )}
      <ScaledIcon color={active ? 'primary' : 'disabled'} icon={icon} size='large' />
      <Typography color={active ? 'primary' : 'disabled'} level={4} noSelect>
        {label}
      </Typography>
    </DrawerBlockContainer>
  );
};

export default function MobileFilterDrawer() {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showFilterDrawer);
  const { filters } = useAppSelector((state) => state.mailbox);

  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowFilterDrawer(false));
  }, [dispatch]);
  const drawerBlocks: DrawerBlockProps[] = [
    {
      active: !Object.keys(filters).length,
      icon: Icon.Mailbox,
      label: MailboxFilters.ALL,
      onClick: () => dispatch(skemailMailboxReducer.actions.setFilters({ filters: {} }))
    },
    {
      active: filters.read === true,
      icon: Icon.EnvelopeRead,
      label: MailboxFilters.READ,
      onClick: () => dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: true } }))
    },
    {
      active: filters.read === false,
      icon: Icon.EnvelopeUnread,
      label: MailboxFilters.UNREAD,
      onClick: () => dispatch(skemailMailboxReducer.actions.setFilters({ filters: { read: false } }))
    },
    {
      active: filters.attachments === true,
      icon: Icon.PaperClip,
      label: MailboxFilters.ATTACHMENTS,
      onClick: () => dispatch(skemailMailboxReducer.actions.setFilters({ filters: { attachments: true } }))
    }
  ];
  return (
    <Drawer hideDrawer={hideDrawer} noSelect={true} show={show}>
      <DrawerOptionsContentContainer>
        <Typography level={1} type='heading'>
          Filter emails
        </Typography>
        <Typography color='disabled' level={3}>
          Adjust the mailbox to only show certain messages
        </Typography>
        <DrawerBlocksContainer>
          {drawerBlocks.map((blockProps) => (
            <DrawerBlock {...blockProps} key={blockProps.label} />
          ))}
        </DrawerBlocksContainer>
      </DrawerOptionsContentContainer>
    </Drawer>
  );
}
