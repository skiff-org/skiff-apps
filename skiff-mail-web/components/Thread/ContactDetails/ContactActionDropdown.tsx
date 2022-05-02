import { useDispatch } from 'react-redux';

import { Dropdown, DropdownItem, Icon } from '../../../../skiff-ui/src';
import { AddressObject } from '../../../generated/graphql';
import useCustomSnackbar from '../../../hooks/useCustomSnackbar';
import { useDrafts } from '../../../hooks/useDrafts';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';

interface ContactActionDropdownProps {
  setShowActionDropdown: (boolean) => void;
  buttonRef: React.RefObject<HTMLDivElement>;
  address: AddressObject;
}

const ContactActionDropdown: React.FC<ContactActionDropdownProps> = ({
  setShowActionDropdown,
  buttonRef,
  address: addressObj
}) => {
  const { address } = addressObj;
  const { composeNewDraft } = useDrafts();
  const { enqueueCustomSnackbar } = useCustomSnackbar();

  const dispatch = useDispatch();

  const directMessage = () => {
    composeNewDraft();
    dispatch(skemailModalReducer.actions.openCompose({ populateComposeToAddresses: [addressObj] }));
  };
  const showAddressCopiedSnackbar = () => {
    enqueueCustomSnackbar({
      body: 'Address copied',
      icon: Icon.Clipboard
    });
  };
  return (
    <Dropdown buttonRef={buttonRef} portal setShowDropdown={setShowActionDropdown}>
      <DropdownItem
        icon={Icon.Send}
        key={`message-address-${address}`}
        label='Direct Message'
        onClick={() => {
          directMessage();
          setShowActionDropdown(false);
        }}
      />
      <DropdownItem
        icon={Icon.Clipboard}
        key={`copy-address-${address}`}
        label='Copy address'
        onClick={async () => {
          await navigator.clipboard.writeText(address);
          showAddressCopiedSnackbar();
          setShowActionDropdown(false);
        }}
      />
    </Dropdown>
  );
};

export default ContactActionDropdown;
