import { Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import { FC, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  Drawer,
  DrawerOption,
  DrawerOptions,
  SettingValue,
  TabPage,
  getContactWithoutTypename,
  isWalletLookupSupported,
  splitEmailToAliasAndDomain,
  useCurrentUserEmailAliases,
  useGetContactWithEmailAddress,
  useToast
} from 'skiff-front-utils';
import { AddressObject, DisplayPictureData } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';
import { v4 } from 'uuid';

import client from '../../../apollo/client';
import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import { useDrafts } from '../../../hooks/useDrafts';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { getWalletLookUpText, openWalletLookupLink } from '../../../utils/walletUtils/walletUtils';
import { useSettings } from '../../Settings/useSettings';
import { ConfirmUpdateNotificationsForSenderModal, NotificationsForSenderState } from '../../shared/Silencing';

interface ContactActionDropdownProps {
  show: boolean;
  setShowActionDropdown: (boolean) => void;
  buttonRef: React.RefObject<HTMLDivElement>;
  address: AddressObject;
  notificationsMuted?: boolean;
  displayPictureData?: DisplayPictureData;
}

const ContactActionDropdown: FC<ContactActionDropdownProps> = ({
  show,
  setShowActionDropdown,
  buttonRef,
  address: addressObj,
  notificationsMuted,
  displayPictureData
}) => {
  const { activeThreadID } = useThreadActions();
  const { address, name } = addressObj;
  const { composeNewDraft } = useDrafts();
  const { enqueueToast } = useToast();
  const { openSettings } = useSettings();
  const { emailAliases } = useCurrentUserEmailAliases();
  const isSelf = emailAliases.some((alias) => alias === address);
  const contact = useGetContactWithEmailAddress({ emailAddress: address, client });
  const isContact = !!contact;
  const contactDisplayName = useDisplayNameFromAddress(addressObj);
  const defaultDisplayName = name ?? address;

  const [confirmHideNotificationsOpenState, setConfirmHideNotificationsOpenState] =
    useState<NotificationsForSenderState>();

  const dispatch = useDispatch();

  const directMessage = () => {
    composeNewDraft();
    dispatch(skemailModalReducer.actions.directMessageCompose(addressObj));
  };
  const showAddressCopiedToast = () => {
    enqueueToast({
      title: 'Address copied',
      body: `${address} saved to clipboard.`
    });
  };

  const getContent = () => {
    const { alias } = splitEmailToAliasAndDomain(address);
    return [
      {
        icon: Icon.Compose,
        key: `message-address-${address}`,
        label: `Email ${contactDisplayName ?? defaultDisplayName}`,
        onClick: () => {
          directMessage();
          setShowActionDropdown(false);
        }
      },
      {
        icon: notificationsMuted ? Icon.Bell : Icon.BellSlash,
        key: `notifications-${address}`,
        label: notificationsMuted ? 'Turn on notifications' : 'Turn off notifications',
        onClick: (e?: React.MouseEvent) => {
          e?.stopPropagation();
          setConfirmHideNotificationsOpenState(
            notificationsMuted ? NotificationsForSenderState.ON : NotificationsForSenderState.OFF
          );
          setShowActionDropdown(false);
        }
      },
      ...insertIf(!isSelf, {
        icon: Icon.UserCircle,
        key: `add-contact-${address}`,
        label: isContact ? 'View contact' : 'Add contact',
        onClick: (e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (!isContact) {
            const splitName = name?.split(' ');
            const isTwoWords = splitName?.length === 2;
            const contactContent = {
              contactID: v4(),
              firstName: isTwoWords ? splitName[0] : name ? name : '',
              lastName: isTwoWords ? splitName[1] : undefined,
              address,
              displayPictureData
            };
            if (!!contactContent) {
              dispatch(skemailModalReducer.actions.openAddContactWithContent(contactContent));
            }
          } else {
            dispatch(skemailModalReducer.actions.openAddContactWithSelectedContact(getContactWithoutTypename(contact)));
          }
          openSettings({
            tab: TabPage.Contacts,
            setting: SettingValue.Contacts
          });
          setShowActionDropdown(false);
        }
      }),
      {
        icon: Icon.Copy,
        key: `copy-address-${address}`,
        label: 'Copy address',
        onClick: async () => {
          await navigator.clipboard.writeText(address);
          showAddressCopiedToast();
          setShowActionDropdown(false);
        }
      },
      ...insertIf(isWalletLookupSupported(alias), {
        icon: Icon.ExternalLink,
        key: `view-wallet-${address}`,
        label: getWalletLookUpText(alias),
        onClick: () => {
          openWalletLookupLink(alias);
          setShowActionDropdown(false);
        }
      })
    ];
  };

  const content = getContent();

  return (
    <>
      {/* For animations to work drawer should always be rendered */}
      {isMobile && (
        <Drawer hideDrawer={() => setShowActionDropdown(false)} show={show}>
          <DrawerOptions>
            {content.map(({ icon, key, onClick, label }) => {
              return (
                <DrawerOption key={key} onClick={onClick}>
                  <DropdownItem icon={icon} label={label} />
                </DrawerOption>
              );
            })}
          </DrawerOptions>
        </Drawer>
      )}
      {!isMobile && (
        <Dropdown
          buttonRef={buttonRef}
          minWidth={200}
          portal
          setShowDropdown={setShowActionDropdown}
          showDropdown={show}
        >
          {content.map(({ icon, key, onClick, label }) => {
            return <DropdownItem icon={icon} key={key} label={label} onClick={onClick} />;
          })}
        </Dropdown>
      )}
      <ConfirmUpdateNotificationsForSenderModal
        confirmHideNotificationsOpen={!!confirmHideNotificationsOpenState}
        emailAddresses={[address]}
        setConfirmHideNotificationsOpen={(open) =>
          setConfirmHideNotificationsOpenState(!open ? undefined : confirmHideNotificationsOpenState)
        }
        state={confirmHideNotificationsOpenState ?? NotificationsForSenderState.OFF}
        threadID={activeThreadID}
      />
    </>
  );
};

export default ContactActionDropdown;
