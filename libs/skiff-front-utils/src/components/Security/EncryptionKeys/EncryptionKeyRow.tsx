import { Icon, IconText, Icons, Tooltip, TooltipContent, TooltipTrigger, Typography } from 'nightwatch-ui';
import { useEffect, useRef, useState } from 'react';
import { PgpPublicKey, readArmoredPublicKey } from 'skiff-crypto-v2';
import { PgpInfo } from 'skiff-graphql';
import styled from 'styled-components';
import { useToast } from '../../../hooks';
import { usePgpDataFromPublicKey } from '../../../hooks/pgp/usePgpDataFromPublicKey';
import { EncryptionKeyDropdown } from '../../PgpKey';
import { formattedPgpDate, getAlgorithmReadableString } from '../../PgpKey/Pgp.utils';

const KeyRow = styled.div`
  padding: 12px 8px;
  border-bottom: 1px solid var(--border-tertiary);
  display: grid;
  grid-template-columns: 1fr 1fr 0.5fr 1fr minmax(auto, max-content);
  grid-gap: 72px;
  align-items: center;
  box-sizing: border-box;
`;

const Copyable = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  max-width: 148px;
  cursor: pointer;
  box-sizing: border-box;
  padding: 4px;
  :hover {
    background: var(--bg-overlay-tertiary);
  }
`;

const HideContainer = styled.div<{ $hide?: boolean }>`
  opacity: ${({ $hide }) => ($hide ? 0 : 1)};
`;

const HiddenTooltipTrigger = styled(TooltipTrigger)`
  overflow: hidden;
`;

interface EncryptionKeyRowProps {
  pgpKey: PgpInfo;
}

function EncryptionKeyRow({ pgpKey }: EncryptionKeyRowProps) {
  const { emailAlias, publicKey, createdAt } = pgpKey;

  const overflowRef = useRef<HTMLDivElement>(null);
  const { enqueueToast } = useToast();
  const [hover, setHover] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [activePublicKey, setActivePublicKey] = useState<PgpPublicKey | null>(null);

  const { activeAlgorithm, activeFingerprint } = usePgpDataFromPublicKey(activePublicKey);
  useEffect(() => {
    const getActivePublicKey = async () => {
      const armoredPublicKey = await readArmoredPublicKey(publicKey);
      setActivePublicKey(armoredPublicKey);
    };
    void getActivePublicKey();
  }, []);

  const openMoreDropdown = () => {
    setShowDropdown(true);
  };
  const copyFingerprint = () => {
    if (!activeFingerprint) return;
    void navigator.clipboard.writeText(activeFingerprint);
    enqueueToast({
      title: 'Copied to clipboard',
      body: 'Fingerprint copied'
    });
  };

  const algorithmString = getAlgorithmReadableString(activeAlgorithm);

  return (
    <KeyRow>
      <Tooltip>
        <TooltipContent>{emailAlias}</TooltipContent>
        <HiddenTooltipTrigger>
          <Typography>{emailAlias}</Typography>
        </HiddenTooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>{activeFingerprint}</TooltipContent>
        <HiddenTooltipTrigger>
          <Copyable onClick={copyFingerprint} onMouseLeave={() => setHover(false)} onMouseOver={() => setHover(true)}>
            <Typography color={hover ? 'primary' : 'secondary'}>{activeFingerprint}</Typography>
            <HideContainer $hide={!hover}>
              <Icons color='secondary' icon={Icon.Copy} />
            </HideContainer>
          </Copyable>
        </HiddenTooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>{algorithmString}</TooltipContent>
        <HiddenTooltipTrigger>
          <Typography uppercase>{algorithmString.split(' ')[0]}</Typography>
        </HiddenTooltipTrigger>
      </Tooltip>
      <Typography uppercase>{formattedPgpDate(createdAt)}</Typography>
      <IconText color='secondary' onClick={openMoreDropdown} ref={overflowRef} startIcon={Icon.OverflowH} />
      {!!activePublicKey && (
        <EncryptionKeyDropdown
          ownKey
          address={emailAlias}
          buttonRef={overflowRef}
          open={showDropdown}
          publicKey={activePublicKey}
          setOpen={setShowDropdown}
        />
      )}
    </KeyRow>
  );
}

export default EncryptionKeyRow;
