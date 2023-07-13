import { Dropdown, DropdownItem, DropdownItemColor, FilledVariant, Icon, IconButton, Type } from '@skiff-org/skiff-ui';
import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { insertIf, isSkiffAddress } from 'skiff-utils';

import { useDefaultEmailAlias, useToast } from '../../../hooks';
import { copyToClipboardWebAndMobile, formatEmailAddress } from '../../../utils';
import Drawer from '../../Drawer';
import { DrawerOption, DrawerOptions } from '../../DrawerOptions';
import { ConfirmModal } from '../../modals';

interface EmailAliasOptionsProps {
  alias: string;
  includeDeleteOption: boolean;
  userID: string;
  deleteAlias: () => void;
  onSetDefaultAlias?: (newValue: string) => void;
}

const EmailAliasOptions: React.FC<EmailAliasOptionsProps> = ({
  alias,
  includeDeleteOption,
  userID,
  deleteAlias,
  onSetDefaultAlias
}) => {
  // Refs
  const buttonRef = useRef<HTMLDivElement>(null);

  // State
  const [showOptions, setShowOptions] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Custom hooks
  const { enqueueToast } = useToast();
  const [defaultEmailAlias, setDefaultEmailAlias] = useDefaultEmailAlias(
    userID,
    !!onSetDefaultAlias ? (newValue: string) => onSetDefaultAlias(newValue) : undefined
  );
  const isDefaultEmailAlias = alias === defaultEmailAlias;

  const hideOptions = () => setShowOptions(false);

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

  const getOptions = (): {
    key: string;
    icon: Icon;
    label: string;
    onClick: () => void;
    color?: DropdownItemColor;
  }[] => [
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
    <Dropdown buttonRef={buttonRef} portal setShowDropdown={setShowOptions} showDropdown={showOptions}>
      {getOptions().map(({ icon, key, label, color, onClick }) => (
        <DropdownItem color={color} icon={icon} key={key} label={label} onClick={onClick} />
      ))}
    </Dropdown>
  );

  // Reserved custom domain aliases (e.g. 'ethereum.email' ) are also
  // considered to be Skiff addresses when determining deletion policy
  const isCustomDomainAlias = !isSkiffAddress(alias);

  return (
    <>
      <div>
        <IconButton
          icon={Icon.OverflowH}
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions((prev) => !prev);
          }}
          ref={buttonRef}
          type={Type.SECONDARY}
          variant={FilledVariant.UNFILLED}
        />
      </div>
      {isMobile ? renderDrawer() : renderDropdown()}
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
    </>
  );
};

export default EmailAliasOptions;
