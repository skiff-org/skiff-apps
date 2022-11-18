import Link from 'next/link';
import { useRouter } from 'next/router';
import { DropdownItem, Icon, Icons, Typography, Drawer } from 'nightwatch-ui';
import { FC, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme, DrawerOption, DrawerOptions } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { useGetNumUnreadQuery, useUserLabelsQuery } from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import {
  getLabelFromPathParams,
  Label,
  LabelType,
  splitUserLabelsAndFolders,
  SYSTEM_LABELS,
  userLabelFromGraphQL
} from '../../../utils/label';

const Spacer = styled.div`
  height: 4px;
`;

const LabelHeader = styled(Typography)`
  user-select: none;
  margin: 16px 0px 6px 12px;
`;

const CheckIcon = styled(Icons)`
  transform: translateX(8px);
`;

const ForwardAndCount = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Badge = styled.div<{ active: boolean }>`
  width: fit-content;
  background: ${(props) => (props.active ? 'transparent' : 'var(--accent-red-secondary)')};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LabelItem: FC<{ label: Label }> = ({ label }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const routeLabel = getLabelFromPathParams(router.query ? (router.query.label as string) : '');
  const routeLabelRef = useRef(routeLabel);
  routeLabelRef.current = routeLabel;
  const { name: labelName } = useRouterLabelContext();

  const { data } = useGetNumUnreadQuery({
    variables: { label: label.value },
    skip: label.value === SystemLabels.Sent || label.value === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const numUnread = data?.unread ?? 0;
  const dispatch = useDispatch();

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
  const forwardAndCount = (
    <ForwardAndCount>
      <Badge active>
        {label.name === labelName && <CheckIcon icon={Icon.Check} size='large' />}
        {label.name !== labelName && numUnread > 0 && <Typography color='primary'>{numUnread}</Typography>}
      </Badge>
    </ForwardAndCount>
  );

  return (
    <Link href={href} passHref>
      <DrawerOption
        data-test={label.dataTest}
        onClick={() => {
          dispatch(skemailMobileDrawerReducer.actions.setShowMailboxSelectDrawer(false));
        }}
      >
        <DropdownItem
          endElement={forwardAndCount}
          icon={getStartIcon(label)}
          label={label.name}
          noSelect
          themeMode={theme}
        />
      </DrawerOption>
    </Link>
  );
};

export default function MobileMailboxSelectDrawer() {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showMailboxSelectDrawer);

  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMailboxSelectDrawer(false));
  }, [dispatch]);

  const { data: userLabelsData } = useUserLabelsQuery();
  const userLabelsAndFolders = userLabelsData?.userLabels?.map(userLabelFromGraphQL) ?? [];
  const [userLabels, userFolderLabels] = splitUserLabelsAndFolders(userLabelsAndFolders);

  return (
    <Drawer hideDrawer={hideDrawer} show={show}>
      <Spacer />
      <DrawerOptions>
        <LabelHeader color='secondary' level={1}>
          Mailbox
        </LabelHeader>
        {SYSTEM_LABELS.map((label) => (
          <LabelItem key={label.value} label={label} />
        ))}
        {userFolderLabels.length > 0 && (
          <LabelHeader color='secondary' level={1}>
            Folders
          </LabelHeader>
        )}
        {userFolderLabels.map((label) => (
          <LabelItem key={label.value} label={label} />
        ))}
        {userLabels.length > 0 && (
          <LabelHeader color='secondary' level={1}>
            Labels
          </LabelHeader>
        )}
        {userLabels.map((label) => (
          <LabelItem key={label.value} label={label} />
        ))}
      </DrawerOptions>
    </Drawer>
  );
}
