import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import { Dropdown, DropdownItem, DropdownItemColor, Icon, IconText } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetCurrentUserCustomDomainsQuery, useSetCatchallAddressMutation } from 'skiff-front-graphql';
import { insertIf, isPaywallErrorCode, isSkiffAddress, PaywallErrorCode } from 'skiff-utils';

import { useDefaultEmailAlias, useToast } from '../../../hooks';
import { copyToClipboardWebAndMobile, formatEmailAddress } from '../../../utils';
import Drawer, { DrawerOption, DrawerOptions } from '../../Drawer';
import { ConfirmModal, PaywallModal } from '../../modals';
import AliasProfileModal from '../../modals/AliasProfileModal';
import { SettingsPage, TabPage } from '../../Settings/Settings.types';

interface EmailAliasOptionsProps {
  alias: string;
  includeDeleteOption: boolean;
  userID: string;
  deleteAlias: () => void;
  client?: ApolloClient<NormalizedCacheObject>;
  onSetDefaultAlias?: (newValue: string) => void;
  openSettings?: (page: SettingsPage) => void;
  setSelectedAddress?: (address: string | undefined) => void;
}

const EmailAliasOptions: React.FC<EmailAliasOptionsProps> = ({
  alias,
  includeDeleteOption,
  userID,
  deleteAlias,
  client,
  onSetDefaultAlias,
  openSettings,
  setSelectedAddress
}) => {
  // Refs
  const buttonRef = useRef<HTMLDivElement>(null);

  // Paywall for setting catch-all address
  const [paywallErrorCode, setPaywallErrorCode] = useState<PaywallErrorCode | null>(null);

  // State
  const [showOptions, setShowOptions] = useState(false);
  const [showAliasProfileModal, setShowAliasProfileModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Custom hooks
  const { enqueueToast } = useToast();
  const [defaultEmailAlias, setDefaultEmailAlias] = useDefaultEmailAlias(
    userID,
    !!onSetDefaultAlias ? (newValue: string) => onSetDefaultAlias(newValue) : undefined
  );
  const isDefaultEmailAlias = alias === defaultEmailAlias;

  const hideOptions = () => setShowOptions(false);

  const onClickEdit = () => {
    hideOptions();
    setShowAliasProfileModal(true);
  };

  const onClickView = () => {
    hideOptions();
    if (setSelectedAddress) setSelectedAddress(alias);
  };

  const onClickCopy = () => {
    hideOptions();
    copyToClipboardWebAndMobile(alias);
    enqueueToast({
      title: 'Email alias copied',
      body: `${alias} is now in your clipboard.`
    });
  };

  const onClickDelete = () => {
    hideOptions();
    setShowConfirmDelete(true);
  };

  const onClickMarkAsDefault = async () => {
    hideOptions();
    await setDefaultEmailAlias(alias);
  };

  const { data } = useGetCurrentUserCustomDomainsQuery();
  const domains = data?.getCurrentUserCustomDomains.domains;
  const currentAliasDomain = alias.split('@')[1];
  const domainID = domains?.find((domain) => domain.domain === currentAliasDomain)?.domainID;
  // same as ManageCustomDomainRow
  const [setCatchallAddress] = useSetCatchallAddressMutation();
  // Not passing an emailAlias means we are removing the catch-all address
  const runSetCatchallAddress = async () => {
    // get domainID for current alias
    if (!domainID) {
      console.error('Could not find domainID for alias:', alias);
      return;
    }
    try {
      await setCatchallAddress({ variables: { request: { domainID, emailAlias: alias } } });
      // close dropdown
      hideOptions();
      enqueueToast({
        title: 'Catch-all address set',
        body: `${alias} is now the catch-all address for ${currentAliasDomain}.`
      });
    } catch (e) {
      // Typescript won't allow us to annotate `e` as ApolloError above, so
      // we cast it below
      const code = (e as ApolloError)?.graphQLErrors?.[0].extensions.code as PaywallErrorCode;
      if (isPaywallErrorCode(code)) {
        setPaywallErrorCode(code);
        return;
      }
      console.error('Failed to set catch-all address:', e);
    }
  };

  const getOptions = (): {
    key: string;
    icon: Icon;
    label: string;
    onClick: () => void;
    color?: DropdownItemColor;
  }[] => [
    ...insertIf(!!client && !setSelectedAddress, {
      key: 'edit',
      icon: Icon.Edit,
      label: 'Edit profile',
      onClick: onClickEdit
    }),
    ...insertIf(!!client && !!setSelectedAddress, {
      key: 'view',
      icon: Icon.Eye,
      label: 'View profile',
      onClick: onClickView
    }),
    {
      key: 'copy',
      icon: Icon.Clipboard,
      label: 'Copy',
      onClick: onClickCopy
    },
    ...insertIf(!isDefaultEmailAlias, {
      key: 'set-default',
      icon: Icon.Star,
      label: 'Set default',
      onClick: onClickMarkAsDefault
    }),
    ...insertIf(!!domainID && !!openSettings, {
      key: 'catchall',
      icon: Icon.At,
      label: 'Set catch-all',
      onClick: () => void runSetCatchallAddress()
    }),
    ...insertIf(includeDeleteOption && !isDefaultEmailAlias, {
      key: 'delete',
      icon: Icon.Trash,
      label: 'Delete',
      onClick: onClickDelete,
      color: 'destructive' as const
    })
  ];

  const renderDrawer = () => (
    <Drawer hideDrawer={hideOptions} show={showOptions} title='Alias options'>
      <DrawerOptions>
        {getOptions().map(({ icon, key, label, color, onClick }) => (
          <DrawerOption key={key}>
            <DropdownItem color={color} icon={icon} label={label} onClick={onClick} />
          </DrawerOption>
        ))}
      </DrawerOptions>
    </Drawer>
  );

  const renderDropdown = () => (
    <Dropdown buttonRef={buttonRef} minWidth={200} portal setShowDropdown={setShowOptions} showDropdown={showOptions}>
      {getOptions().map(({ icon, key, label, color, onClick }) => (
        <DropdownItem color={color} icon={icon} key={key} label={label} onClick={onClick} />
      ))}
    </Dropdown>
  );

  const onPaywallUpgradeClicked = () => {
    if (!openSettings) return;
    setPaywallErrorCode(null);
    openSettings({
      indices: { tab: TabPage.Plans }
    });
  };

  // Reserved custom domain aliases (e.g. 'ethereum.email' ) are also
  // considered to be Skiff addresses when determining deletion policy
  const isCustomDomainAlias = !isSkiffAddress(alias);

  return (
    <>
      <div>
        <IconText
          startIcon={Icon.OverflowH}
          onClick={(e) => {
            e?.stopPropagation();
            setShowOptions((prev) => !prev);
          }}
          ref={buttonRef}
          color='secondary'
        />
      </div>
      {isMobile ? renderDrawer() : renderDropdown()}
      {/* Alias profile modal */}
      {!!client && (
        <AliasProfileModal
          alias={alias}
          client={client}
          isOpen={showAliasProfileModal}
          setIsOpen={setShowAliasProfileModal}
        />
      )}
      {/* Delete alias confirm modal */}
      <ConfirmModal
        confirmName='Delete'
        description={
          isCustomDomainAlias
            ? 'You will no longer be able to send or receive mail from this alias. Anyone in your workspace may claim this alias again.'
            : 'Deleting is a permanent action and this alias cannot be claimed again.'
        }
        destructive
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={deleteAlias}
        open={showConfirmDelete}
        title={`Delete ${formatEmailAddress(alias)}?`}
      />
      {paywallErrorCode && (
        <PaywallModal
          onClose={() => setPaywallErrorCode(null)}
          onUpgrade={onPaywallUpgradeClicked}
          open={!!paywallErrorCode}
          paywallErrorCode={paywallErrorCode}
        />
      )}
    </>
  );
};

export default EmailAliasOptions;
