import { Dropdown, DropdownItem, Icon, IconText, Icons, Size, TypographyWeight } from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { readArmoredPublicKey } from 'skiff-crypto-v2';
import { PgpInfo } from 'skiff-front-graphql';
import styled from 'styled-components';
import { useToast } from '../../hooks';
import { ConfirmModal } from '../modals';

const RightActions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

const RowContainer = styled.div`
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  background: var(--bg-overlay-quaternary);
  > span {
    overflow: hidden;
  }
`;

interface DisabledKeyRowProps {
  pgpKey: PgpInfo;
}

const DisabledKeyRow: React.FC<DisabledKeyRowProps> = ({ pgpKey }) => {
  const overflowButtonRef = React.useRef<HTMLDivElement>(null);
  const [showOptionDropdown, setShowOptionDropdown] = useState(false);
  const [activeFingerprint, setActiveFingerprint] = useState<string | undefined>(undefined);
  const [showDeleteKeyModal, setShowDeleteKeyModal] = useState(false);
  const { enqueueToast } = useToast();
  const { publicKey } = pgpKey;

  const openOptionDropdown = () => {
    setShowOptionDropdown(true);
  };

  useEffect(() => {
    const populateData = async () => {
      const activePublicKey = await readArmoredPublicKey(publicKey);
      const fingerPrint = activePublicKey.getFingerprint();
      setActiveFingerprint(fingerPrint);
    };
    void populateData();
  }, [publicKey]);

  if (!activeFingerprint) return null;
  return (
    <>
      <RowContainer>
        <IconText
          label={activeFingerprint}
          color='secondary'
          size={Size.SMALL}
          weight={TypographyWeight.REGULAR}
          startIcon={<Icons icon={Icon.Key} color='disabled' size={14} />}
        />
        <RightActions>
          <IconText ref={overflowButtonRef} color='disabled' onClick={openOptionDropdown} startIcon={Icon.OverflowH} />
        </RightActions>
      </RowContainer>
      <Dropdown
        buttonRef={overflowButtonRef}
        minWidth={200}
        portal
        setShowDropdown={setShowOptionDropdown}
        showDropdown={showOptionDropdown}
      >
        <DropdownItem
          icon={Icon.Download}
          key='export'
          label='Export key'
          onClick={() => {
            setShowOptionDropdown(false);
            enqueueToast({
              title: 'Key has been saved',
              body: 'Your key has been successfully downloaded to your device.'
            });
          }}
        />
        <DropdownItem
          key='delete'
          color='destructive'
          icon={Icon.Trash}
          label='Delete key'
          onClick={() => {
            setShowDeleteKeyModal(true);
            setShowOptionDropdown(false);
          }}
        />
      </Dropdown>
      <ConfirmModal
        title='Confirm deleting key?'
        description='Deleting this key will also delete any threads in inbox that was decrypted with this key.'
        open={showDeleteKeyModal}
        destructive
        onClose={() => setShowDeleteKeyModal(false)}
        confirmName='Delete key'
        onConfirm={() => {}}
      />
    </>
  );
};

export default DisabledKeyRow;
