import { Drawer, Dropdown, DropdownItem, Icon, IconText } from 'nightwatch-ui';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  formatEmailAddress,
  isWalletAddress,
  splitEmailToAliasAndDomain,
  useToast,
  DrawerOption,
  DrawerOptions
} from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import { insertIf, isENSName } from 'skiff-utils';
import styled from 'styled-components';

import { useDrafts } from '../../../hooks/useDrafts';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { getWalletLookUpText, openWalletLookupLink } from '../../../utils/walletUtils/walletUtils';

const StyledDropdown = styled(Dropdown)`
  padding-right: 16px;
`;

interface ContactActionDropdownProps {
  show: boolean;
  setShowActionDropdown: (boolean) => void;
  buttonRef: React.RefObject<HTMLDivElement>;
  address: AddressObject;
  displayAddress?: boolean;
}

const ContactActionDropdown: FC<ContactActionDropdownProps> = ({
  show,
  setShowActionDropdown,
  buttonRef,
  displayAddress,
  address: addressObj
}) => {
  const { address } = addressObj;
  const { composeNewDraft } = useDrafts();
  const { enqueueToast } = useToast();

  const dispatch = useDispatch();

  const directMessage = () => {
    composeNewDraft();
    dispatch(skemailModalReducer.actions.directMessageCompose(addressObj));
  };
  const showAddressCopiedToast = () => {
    enqueueToast({
      body: 'Address copied',
      icon: Icon.Clipboard
    });
  };

  const getContent = () => {
    const [alias] = splitEmailToAliasAndDomain(address);
    return [
      ...insertIf(!!displayAddress, {
        icon: undefined,
        onClick: () => {},
        key: `from-address-${address}`,
        label: formatEmailAddress(address)
      }),
      {
        icon: Icon.Send,
        key: `message-address-${address}`,
        label: 'Direct Message',
        onClick: () => {
          directMessage();
          setShowActionDropdown(false);
        }
      },
      {
        icon: Icon.Clipboard,
        key: `copy-address-${address}`,
        label: 'Copy address',
        onClick: async () => {
          await navigator.clipboard.writeText(address);
          showAddressCopiedToast();
          setShowActionDropdown(false);
        }
      },
      ...insertIf(isWalletAddress(alias) || isENSName(alias), {
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
                  <IconText label={label} level={1} startIcon={icon} type='paragraph' />
                </DrawerOption>
              );
            })}
          </DrawerOptions>
        </Drawer>
      )}
      {/* Only render dropdown when it is needed to be shown */}
      {show && !isMobile && (
        <StyledDropdown buttonRef={buttonRef} portal setShowDropdown={setShowActionDropdown}>
          {content.map(({ icon, key, onClick, label }) => {
            return <DropdownItem icon={icon} key={key} label={label} onClick={onClick} />;
          })}
        </StyledDropdown>
      )}
    </>
  );
};

export default ContactActionDropdown;
