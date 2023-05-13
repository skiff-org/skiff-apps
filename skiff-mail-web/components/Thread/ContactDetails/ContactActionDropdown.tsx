import { Drawer, Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  DrawerOption,
  DrawerOptions,
  isWalletLookupSupported,
  splitEmailToAliasAndDomain,
  useToast
} from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';

import { useDrafts } from '../../../hooks/useDrafts';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { getWalletLookUpText, openWalletLookupLink } from '../../../utils/walletUtils/walletUtils';

interface ContactActionDropdownProps {
  show: boolean;
  setShowActionDropdown: (boolean) => void;
  buttonRef: React.RefObject<HTMLDivElement>;
  address: AddressObject;
}

const ContactActionDropdown: FC<ContactActionDropdownProps> = ({
  show,
  setShowActionDropdown,
  buttonRef,
  address: addressObj
}) => {
  const { address, name } = addressObj;
  const { composeNewDraft } = useDrafts();
  const { enqueueToast } = useToast();

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
        icon: Icon.Send,
        key: `message-address-${address}`,
        label: `Email ${name ?? address}`,
        onClick: () => {
          directMessage();
          setShowActionDropdown(false);
        }
      },
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
        <Dropdown buttonRef={buttonRef} portal setShowDropdown={setShowActionDropdown} showDropdown={show}>
          {content.map(({ icon, key, onClick, label }) => {
            return <DropdownItem icon={icon} key={key} label={label} onClick={onClick} />;
          })}
        </Dropdown>
      )}
    </>
  );
};

export default ContactActionDropdown;
