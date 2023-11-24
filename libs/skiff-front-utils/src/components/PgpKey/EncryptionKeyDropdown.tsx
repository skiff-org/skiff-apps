import { Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import { useState } from 'react';
import { decryptSymmetric, stringDecryptAsymmetric } from 'skiff-crypto';
import { PgpPublicKey, exportPGPKey, readArmoredPrivateKey } from 'skiff-crypto-v2';
import { PgpInfo, PgpKeyDatagram, useGetPgpInfoQuery } from 'skiff-front-graphql';

import { requireCurrentUserData } from '../../apollo';
import { ConfirmModal } from '../modals';
import PgpViewKeyModal from './PgpViewKeyModal';

interface EncryptionKeysProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  publicKey: PgpPublicKey;
  buttonRef: React.RefObject<HTMLDivElement>;
  address: string;
  ownKey?: boolean;
}

function EncryptionKeyDropdown({ open, setOpen, publicKey, buttonRef, address, ownKey }: EncryptionKeysProps) {
  const [showViewKeyModal, setShowViewKeyModal] = useState(false);
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [showDeleteKeyModal, setShowDeleteKeyModal] = useState(false);
  const currentUser = requireCurrentUserData();
  const { data: pgpKeyData } = useGetPgpInfoQuery({
    variables: { emailAlias: address, allKeys: false }
  });
  const activeKey = pgpKeyData?.pgpInfo[0] as PgpInfo;

  function download(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  const handleExport = async () => {
    const userIDs = [{ email: address }];
    const createdAt = publicKey.getCreationTime();
    const userPrivateKey = currentUser.privateUserData.privateKey;

    const decryptedSessionKey = stringDecryptAsymmetric(
      userPrivateKey || '',
      activeKey.encryptedSessionKey.encryptedBy,
      activeKey.encryptedSessionKey.encryptedSessionKey
    );

    const decryptedPrivateKey = decryptSymmetric(
      activeKey.encryptedPrivateKey.encryptedData,
      decryptedSessionKey,
      PgpKeyDatagram
    );

    const privateKey = await readArmoredPrivateKey(decryptedPrivateKey);
    const { privateKey: armoredPrivateKey, publicKey: armoredPublicKey } = await exportPGPKey(
      userIDs,
      privateKey,
      createdAt
    );
    // Call the download function for the private key
    download('privateKey.asc', armoredPrivateKey);
    // Call the download function for the public key
    download('publicKey.asc', armoredPublicKey);
  };

  return (
    <>
      <Dropdown buttonRef={buttonRef} minWidth={200} portal setShowDropdown={setOpen} showDropdown={open}>
        {!ownKey && (
          <DropdownItem
            icon={Icon.Plus}
            label='Add new key'
            onClick={() => {
              setShowAddKeyModal(true);
              setOpen(false);
            }}
          />
        )}
        <DropdownItem
          icon={Icon.Eye}
          label='View full key'
          onClick={() => {
            setShowViewKeyModal(true);
            setOpen(false);
          }}
        />
        {ownKey && (
          <>
            <DropdownItem
              icon={Icon.Download}
              label='Export key'
              onClick={async () => {
                void handleExport();
                setOpen(false);
              }}
            />
          </>
        )}
        {!ownKey && <DropdownItem color='destructive' icon={Icon.Remove} label='Remove key' onClick={() => {}} />}
        {ownKey && (
          <DropdownItem
            color='destructive'
            icon={Icon.Trash}
            label='Delete key'
            onClick={() => {
              setShowDeleteKeyModal(true);
              setOpen(false);
            }}
          />
        )}
      </Dropdown>
      <ConfirmModal
        title='Import new key?'
        description="New import key will become this contact's primary key and deactivate the current active key."
        open={showAddKeyModal}
        onClose={() => setShowAddKeyModal(false)}
        confirmName='Import key'
        onConfirm={() => {}}
      />
      <ConfirmModal
        title='Confirm deleting key?'
        destructive
        description='Deleting this key will also delete any threads in inbox that was decrypted with this key.'
        open={showDeleteKeyModal}
        onClose={() => setShowDeleteKeyModal(false)}
        confirmName='Delete key'
        onConfirm={() => {}}
      />
      <PgpViewKeyModal
        address={address}
        open={showViewKeyModal}
        onClose={() => setShowViewKeyModal(false)}
        publicKey={publicKey}
      />
    </>
  );
}

export default EncryptionKeyDropdown;
