import dayjs from 'dayjs';
import { Divider, Icon, IconText, Icons, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { useState } from 'react';
import { PgpPublicKey } from 'skiff-crypto-v2';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';
import { HourFormatValue } from '../../constants';
import { useUserPreference } from '../../hooks';
import { usePgpDataFromPublicKey } from '../../hooks/pgp/usePgpDataFromPublicKey';
import EncryptionKeyDropdown from './EncryptionKeyDropdown';
import { formattedPgpDate, getAlgorithmReadableString } from './Pgp.utils';
import { HeaderContainer } from './PgpSection.constants';

const RightActions = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

const KeyTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const KeyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const KeyTableRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <KeyRow>
      <Typography size={TypographySize.SMALL}>{label}</Typography>
      <Typography color='secondary' size={TypographySize.SMALL}>
        {value}
      </Typography>
    </KeyRow>
  );
};

interface PgpKeyTableProps {
  activePublicKey: PgpPublicKey;
  address: string;
  isSkiffManagedKey?: boolean;
  ownKey?: boolean;
  hideActions?: boolean;
}

export const PgpKeyTable: React.FC<PgpKeyTableProps> = ({
  ownKey,
  address,
  activePublicKey,
  isSkiffManagedKey,
  hideActions
}) => {
  const [expanded, setExpanded] = useState(hideActions);
  const [showOptionDropdown, setShowOptionDropdown] = useState(false);
  const overflowButtonRef = React.useRef<HTMLDivElement>(null);
  const [hourFormat] = useUserPreference(StorageTypes.HOUR_FORMAT);

  const openOptionDropdown = () => {
    setShowOptionDropdown(true);
  };

  const onExpandToggle = () => {
    setExpanded(!expanded);
  };

  const { activeAlgorithm, activeExpires, activeCreation, activeFingerprint } =
    usePgpDataFromPublicKey(activePublicKey);

  const algorithmString = getAlgorithmReadableString(activeAlgorithm);

  return (
    <>
      <HeaderContainer>
        <IconText
          label={activeFingerprint}
          color='secondary'
          size={Size.SMALL}
          weight={TypographyWeight.REGULAR}
          startIcon={<Icons icon={Icon.Key} color='green' size={14} />}
        />
        {!hideActions && (
          <RightActions>
            <IconText
              ref={overflowButtonRef}
              color='disabled'
              onClick={openOptionDropdown}
              startIcon={Icon.OverflowH}
            />
            <IconText
              color='disabled'
              onClick={onExpandToggle}
              startIcon={expanded ? Icon.ChevronUp : Icon.ChevronRight}
            />
          </RightActions>
        )}
      </HeaderContainer>
      {expanded && (
        <KeyTable>
          <Divider />
          <KeyTableRow
            label='Date added'
            value={dayjs(activeCreation).format(
              `MMM DD, YYYY [at] ${hourFormat === HourFormatValue.Twelve ? 'hh:mm A' : 'HH:mm'}`
            )}
          />
          {!!activeExpires && (
            <KeyTableRow
              label='Expires'
              value={activeExpires === Infinity ? 'Never' : formattedPgpDate(activeExpires)}
            />
          )}
          {!!activeAlgorithm && <KeyTableRow label='Key type' value={algorithmString.toUpperCase()} />}
          <KeyTableRow label='Verified via' value={isSkiffManagedKey ? 'Manually added' : 'Web Key Directory'} />
        </KeyTable>
      )}
      <EncryptionKeyDropdown
        address={address}
        buttonRef={overflowButtonRef}
        open={showOptionDropdown}
        publicKey={activePublicKey}
        ownKey={ownKey}
        setOpen={setShowOptionDropdown}
      />
    </>
  );
};

export default PgpKeyTable;
