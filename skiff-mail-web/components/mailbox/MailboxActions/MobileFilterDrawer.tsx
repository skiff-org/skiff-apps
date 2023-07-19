import { Drawer, Icon, Icons, Size, ThemeMode, themeNames, Typography, TypographySize } from '@skiff-org/skiff-ui';
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

  padding: 0 8px;
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
  border: 1px solid
    ${(props) => (props.active ? themeNames.dark['--border-active'] : themeNames.dark['--border-secondary'])};
  border-radius: 12px;
`;

const ScaledIcon = styled.div`
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
  border: 2px solid #242424;
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
          <Icons color='white' icon={Icon.Check} size={Size.X_SMALL} />
        </CheckedIndicator>
      )}
      <ScaledIcon>
        <Icons color={active ? 'primary' : 'disabled'} forceTheme={ThemeMode.DARK} icon={icon} size={Size.X_MEDIUM} />
      </ScaledIcon>
      <Typography
        mono
        uppercase
        color={active ? 'primary' : 'disabled'}
        forceTheme={ThemeMode.DARK}
        mono
        selectable={false}
        size={TypographySize.CAPTION}
      >
        {label.toUpperCase()}
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
    <Drawer hideDrawer={hideDrawer} selectable={false} show={show} title='Filter emails'>
      <DrawerOptionsContentContainer>
        <DrawerBlocksContainer>
          {drawerBlocks.map((blockProps) => (
            <DrawerBlock {...blockProps} key={blockProps.label} />
          ))}
        </DrawerBlocksContainer>
      </DrawerOptionsContentContainer>
    </Drawer>
  );
}
