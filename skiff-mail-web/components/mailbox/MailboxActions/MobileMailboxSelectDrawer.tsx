import Link from 'next/link';
import { useRouter } from 'next/router';
import { DropdownItem, Icon, Icons, Size, ThemeMode, Typography, Drawer, TypographySize } from 'nightwatch-ui';
import { FC, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useGetNumUnreadQuery, useUserLabelsQuery } from 'skiff-front-graphql';
import { DrawerOption, DrawerOptions, useDefaultEmailAlias, useRequiredCurrentUserData } from 'skiff-front-utils';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled from 'styled-components';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useShowAliasInboxes } from '../../../hooks/useShowAliasInboxes';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import {
  getLabelDisplayName,
  getLabelFromPathParams,
  getURLFromLabel,
  Label,
  LabelType,
  orderAliasLabels,
  splitUserLabelsByVariant,
  SYSTEM_LABELS,
  userLabelFromGraphQL
} from '../../../utils/label';

const Spacer = styled.div`
  height: 4px;
`;

const LabelHeader = styled.div`
  margin: 16px 0px 6px 12px;
`;

const CheckIconContainer = styled.div`
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
  const routeLabel = getLabelFromPathParams(router.query ? (router.query.label as string) : '');
  const routeLabelRef = useRef(routeLabel);
  routeLabelRef.current = routeLabel;
  const { name: routerLabelName } = useRouterLabelContext();

  const displayLabelName = getLabelDisplayName(label.name);

  const { data } = useGetNumUnreadQuery({
    variables: { label: label.value },
    skip: label.value === SystemLabels.Sent || label.value === SystemLabels.Drafts,
    pollInterval: POLL_INTERVAL_IN_MS
  });
  const numUnread = data?.unread ?? 0;
  const dispatch = useDispatch();

  const getStartElement = () =>
    label.type === LabelType.USER && label.variant !== UserLabelVariant.Alias ? (
      <Icons color={label.color} forceTheme={ThemeMode.DARK} icon={Icon.Dot} />
    ) : undefined;

  const getStartIcon = () => {
    if (label.type === LabelType.SYSTEM) return label.icon;
    if (label.type === LabelType.USER && label.variant === UserLabelVariant.Alias) return Icon.UserCircle;
    return undefined;
  };

  const href = getURLFromLabel(label);
  const forwardAndCount = (
    <ForwardAndCount>
      <Badge active>
        {label.name === routerLabelName && (
          <CheckIconContainer>
            <Icons forceTheme={ThemeMode.DARK} icon={Icon.Check} size={Size.X_MEDIUM} />
          </CheckIconContainer>
        )}
        {label.name !== routerLabelName && numUnread > 0 && (
          <Typography forceTheme={ThemeMode.DARK}>{numUnread}</Typography>
        )}
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
          icon={getStartIcon()}
          label={displayLabelName}
          startElement={getStartElement()}
        />
      </DrawerOption>
    </Link>
  );
};

export default function MobileMailboxSelectDrawer() {
  const dispatch = useDispatch();
  const show = useAppSelector((state) => state.mobileDrawer.showMailboxSelectDrawer);
  const { showAliasInboxes } = useShowAliasInboxes();

  const hideDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowMailboxSelectDrawer(false));
  }, [dispatch]);

  const { data: userLabelsData } = useUserLabelsQuery();
  const userLabelsAndFolders = userLabelsData?.userLabels?.map(userLabelFromGraphQL) ?? [];
  const { labels, folders, aliasLabels } = splitUserLabelsByVariant(userLabelsAndFolders);

  const user = useRequiredCurrentUserData();
  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID);

  const renderLabelHeader = (title: string) => (
    <Typography color='secondary' forceTheme={ThemeMode.DARK} mono selectable={false} size={TypographySize.SMALL}>
      <LabelHeader>{title.toUpperCase()}</LabelHeader>
    </Typography>
  );

  const orderedAliasLabels = orderAliasLabels(aliasLabels, defaultEmailAlias);

  return (
    <Drawer hideDrawer={hideDrawer} show={show}>
      <Spacer />
      <DrawerOptions>
        {renderLabelHeader('Mailbox')}
        {SYSTEM_LABELS.map((label) => (
          <LabelItem key={label.value} label={label} />
        ))}
        {showAliasInboxes && (
          <>
            {orderedAliasLabels.length > 0 && renderLabelHeader('Aliases')}
            {orderedAliasLabels.map((label) => (
              <LabelItem key={label.value} label={label} />
            ))}
          </>
        )}
        {folders.length > 0 && renderLabelHeader('Folders')}
        {folders.map((label) => (
          <LabelItem key={label.value} label={label} />
        ))}
        {labels.length > 0 && renderLabelHeader('Labels')}
        {labels.map((label) => (
          <LabelItem key={label.value} label={label} />
        ))}
      </DrawerOptions>
    </Drawer>
  );
}
