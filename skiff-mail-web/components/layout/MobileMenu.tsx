import { Icon, IconButton, Icons, IconText, Typography } from '@skiff-org/skiff-ui';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';
import { MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { SystemLabels, useMailboxQuery, useUserLabelsQuery } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useAppHidden from '../../hooks/useAppHidden';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailBottomToolbarReducer } from '../../redux/reducers/bottomToolbarReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailMobileMenuReducer } from '../../redux/reducers/mobileMenuReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { getLabelFromPathParams, Label, LabelType, SYSTEM_LABELS, userLabelFromGraphQL } from '../../utils/label';
import { isMobileApp, sendRNWebviewMsg } from '../../utils/mobileApp';
import MobileSettingsDrawer from '../mailbox/MailboxActions/MobileSettingsDrawer';
import { MobileMenuToolbar } from '../shared/BottomToolbars';

const Body = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  padding: 84px 0px 12px 16px;
`;

const LabelList = styled.div`
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  overflow: auto;
`;

const Badge = styled.div<{ active: boolean }>`
  width: fit-content;
  height: 20px;
  background: ${(props) => (props.active ? 'transparent' : 'var(--accent-red-secondary)')};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Label = styled.div<{ active: boolean; isOver: boolean }>`
  padding: 8px;
  border-radius: 8px;
  align-items: center;
  display: flex;
  justify-content: space-between;
  background-color: ${(props) =>
    props.active ? 'var(--bg-cell-active)' : props.isOver ? 'var(--bg-cell-hover)' : 'transparent'};

  &:hover {
    background-color: ${(props) => (props.active ? 'var(--bg-cell-active)' : 'var(--bg-cell-hover)')};
    cursor: pointer;
  }
`;

const ForwardAndCount = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const LabelItem: React.FC<{ label: Label }> = ({ label }) => {
  const router = useRouter();
  const routeLabel = getLabelFromPathParams(router.query ? (router.query.label as string) : '');
  const routeLabelRef = useRef(routeLabel);
  routeLabelRef.current = routeLabel;

  const { data } = useMailboxQuery({
    variables: { request: { label: label.value } }
  });

  const threads = data?.mailbox?.threads || [];

  const dispatch = useDispatch();

  const numUnread = threads.filter((thread) => !thread.attributes.read).length;

  const getStartIcon = (label: Label) => {
    switch (label.type) {
      case LabelType.SYSTEM:
        return label.icon;
      case LabelType.USER:
        return <Icons color={label.color} icon={Icon.Dot} />;
      default:
        return undefined;
    }
  };

  // Follows pattern used in SidebarItem.tsx
  const encodedLabelName = encodeURIComponent(
    label.type === LabelType.SYSTEM ? label.value.toLowerCase() : label.name.toLowerCase()
  );
  const href = `${label.type === LabelType.SYSTEM ? '/' : '/label#'}${encodedLabelName}`;

  return (
    <Link href={href} passHref>
      <Label
        active={false}
        isOver={false}
        onClick={() => {
          dispatch(skemailMobileMenuReducer.actions.openMenu(false));
        }}
      >
        <IconText label={`${label.name}`} level={1} startIcon={getStartIcon(label)} type='paragraph' />
        <ForwardAndCount>
          {numUnread > 0 && (
            <Badge active>
              <Typography color='primary' level={1} type='paragraph'>
                {numUnread}
              </Typography>
            </Badge>
          )}
          <IconButton icon={Icon.Forward} />
        </ForwardAndCount>
      </Label>
    </Link>
  );
};

// Update mobile badge count
function updateBadgeCount(numUnread: number) {
  if (isMobileApp()) {
    // If we are on mobile app, send unread count to react-native
    sendRNWebviewMsg('unreadMailCount', { numUnread });
  }
}
interface MobileMenuProps {
  body: React.ReactNode;
}
export const MobileMenu = ({ body }: MobileMenuProps) => {
  const { data } = useMailboxQuery({
    variables: { request: { label: SystemLabels.Inbox } }
  });

  const { activeThreadID } = useThreadActions();
  const { data: userLabelsData } = useUserLabelsQuery();
  const userLabels = userLabelsData?.userLabels?.map(userLabelFromGraphQL) ?? [];

  const menuActive = useAppSelector((state) => state.menu.active);
  const dispatch = useDispatch();

  // is the app hidden in the background or visible
  const isHidden = useAppHidden();

  // Get Inbox Data
  const threads = data?.mailbox?.threads || [];
  const unreadCount = threads.filter((thread) => !thread.attributes.read).length;

  useEffect(() => {
    // Communicate with react-native and update about unread mail count
    updateBadgeCount(unreadCount);
    return () => updateBadgeCount(unreadCount);
  }, [unreadCount, menuActive, isHidden]);

  // Open compose email
  const openCompose = useCallback(() => {
    dispatch(skemailModalReducer.actions.openCompose({}));
  }, []);

  const showSettingsDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowSettingsDrawer(true));
  }, [dispatch]);

  useEffect(() => {
    if (menuActive) {
      // When the menu is active show the mobile menu toolbar
      dispatch(
        skemailBottomToolbarReducer.actions.setContent(
          <MobileMenuToolbar
            onComposeClick={openCompose}
            onSettingsClick={showSettingsDrawer}
            unreadCount={unreadCount}
          />
        )
      );
    }
  }, [menuActive, unreadCount]);

  useEffect(() => {
    // Close mobile menu in case of active thread
    if (!!activeThreadID) {
      dispatch(skemailMobileMenuReducer.actions.openMenu(false));
    }
  }, [activeThreadID]);

  if (menuActive) {
    return (
      <>
        <Title>
          <Typography style={{ fontSize: '30px' }} type='heading'>
            Skiff Mail
          </Typography>
        </Title>
        <LabelList>
          {SYSTEM_LABELS.map((label) => (
            <LabelItem key={label.value} label={label} />
          ))}
          {userLabels.map((label) => (
            <LabelItem key={label.value} label={label} />
          ))}
        </LabelList>
        <MobileView>
          <MobileSettingsDrawer />
        </MobileView>
      </>
    );
  } else {
    // When menu is not active show body
    return <Body>{body}</Body>;
  }
};
