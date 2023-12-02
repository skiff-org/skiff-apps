import {
  Color,
  Dropdown,
  FilledVariant,
  Icon,
  IconText,
  Icons,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  getThemedColor
} from 'nightwatch-ui';
import { useEffect, useRef, useState } from 'react';
import { EncryptionBadge, EncryptionBadgeTypes, useGetFF, useToast, useUserPreference } from 'skiff-front-utils';
import { PgpFlag, StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import TrustKeyModal from './TrustKeyModal';

const getBadgeType = (isSkiffSender: boolean | undefined, isPgpSender: boolean) => {
  if (isSkiffSender) {
    return EncryptionBadgeTypes.E2EE;
  } else if (isPgpSender) {
    return EncryptionBadgeTypes.Pgp;
  } else {
    return EncryptionBadgeTypes.External;
  }
};

interface BadgeAttributes {
  title: string;
  description: string;
  bgColor: string;
  iconColor: Color;
  icon: Icon;
}

const badgeAttributes: Record<EncryptionBadgeTypes, BadgeAttributes> = {
  [EncryptionBadgeTypes.E2EE]: {
    title: 'End-to-end encrypted',
    description: 'Email thread is fully end-to-end encrypted.',
    bgColor: 'var(--accent-green-secondary)',
    iconColor: 'green',
    icon: Icon.ShieldCheck
  },
  [EncryptionBadgeTypes.Pgp]: {
    title: 'End-to-end encrypted with PGP',
    description: 'Email thread is PGP encrypted.',
    bgColor: 'var(--bg-overlay-primary)',
    iconColor: 'primary',
    icon: Icon.Lock
  },
  [EncryptionBadgeTypes.External]: {
    title: 'External email',
    description: 'Encrypted by Skiff, standard security protocols externally.',
    bgColor: 'var(--bg-overlay-primary)',
    iconColor: 'primary',
    icon: Icon.Lock
  }
};

const EncryptiondescriptionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const CONTAINER_PADDING = 8;

const PaddedContainer = styled.div`
  padding: ${CONTAINER_PADDING}px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
`;

const IconContainer = styled.div<{ $bgColor: string }>`
  background: ${({ $bgColor }) => getThemedColor($bgColor, ThemeMode.DARK)};
  width: 32px;
  height: 32px;
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ThreadEncryptionBadgeProps {
  sender?: string;
  // is skiff-to-skiff
  isSkiffSender?: boolean;
}

const BadgeRow = ({
  title,
  description,
  bgColor,
  iconColor,
  icon,
  onClick
}: BadgeAttributes & { onClick?: () => void }) => {
  return (
    <EncryptiondescriptionRow>
      <IconContainer $bgColor={bgColor}>
        <Icons color={iconColor} forceTheme={ThemeMode.DARK} icon={icon} size={20} />
      </IconContainer>
      <Text>
        <Typography forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
          {title}
        </Typography>
        <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL} wrap>
          {description}
        </Typography>
      </Text>
      {!!onClick && (
        <IconText
          forceTheme={ThemeMode.DARK}
          label='Trust'
          onClick={onClick}
          size={Size.SMALL}
          variant={FilledVariant.FILLED}
        />
      )}
    </EncryptiondescriptionRow>
  );
};

const ThreadEncryptionBadge = ({ isSkiffSender, sender }: ThreadEncryptionBadgeProps) => {
  const [showEncryptionPopout, setShowEncryptionPopout] = useState(false);
  const [showTrustKeyModal, setShowTrustKeyModal] = useState(false);
  const [confirmTrustKey] = useUserPreference(StorageTypes.CONFIRM_TRUST_KEY);
  const { enqueueToast } = useToast();

  const onTrustKey = () => {
    enqueueToast({
      title: 'Key trusted',
      body: 'You have trusted this key. You will not be prompted to trust this key again.'
    });
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onClickTrustKey = () => {
    setShowEncryptionPopout(false);
    if (!confirmTrustKey) {
      onTrustKey();
    } else {
      setShowTrustKeyModal(true);
    }
  };

  const hasPgpFlag = useGetFF<PgpFlag>('pgp');
  const badgeRef = useRef<HTMLDivElement>(null);
  const senderHasPgp = false;
  const trustedKey = false;
  const badgeType = getBadgeType(isSkiffSender, senderHasPgp);

  // Function to check if the mouse is outside the dropdown bounds
  const handleMouseMove = (event: MouseEvent) => {
    if (dropdownRef.current && showEncryptionPopout) {
      const { left, right, bottom } = dropdownRef.current.getBoundingClientRect();
      if (
        event.clientX < left - CONTAINER_PADDING ||
        event.clientX > right + CONTAINER_PADDING ||
        event.clientY > bottom + CONTAINER_PADDING
      ) {
        setShowEncryptionPopout(false);
      }
    }
  };

  // Effect to add event listener when the dropdown is visible
  useEffect(() => {
    if (showEncryptionPopout) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Cleanup the event listener when the dropdown is not visible or on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showEncryptionPopout]); // Only re-run the effect if showEncryptionPopout changes

  const { title, description, bgColor, iconColor, icon } = badgeAttributes[badgeType];

  return (
    <>
      <div onMouseOver={() => setShowEncryptionPopout(true)} ref={badgeRef}>
        <EncryptionBadge hideTooltip isTrusted={trustedKey} type={badgeType} />
      </div>
      <Dropdown
        buttonRef={badgeRef}
        gapFromAnchor={8}
        portal
        setShowDropdown={setShowEncryptionPopout}
        showDropdown={showEncryptionPopout}
        width={348}
      >
        <PaddedContainer ref={dropdownRef}>
          <BadgeRow bgColor={bgColor} description={description} icon={icon} iconColor={iconColor} title={title} />
          {senderHasPgp && hasPgpFlag && !isSkiffSender && (
            <BadgeRow
              bgColor='var(--bg-overlay-primary)'
              description={`This message is signed with a key from ${sender || 'this sender'}.`}
              icon={Icon.Key}
              iconColor='primary'
              onClick={trustedKey ? undefined : onClickTrustKey}
              title={trustedKey ? 'Trusted key' : 'Key attached'}
            />
          )}
        </PaddedContainer>
      </Dropdown>
      <TrustKeyModal onClose={() => setShowTrustKeyModal(false)} onTrustKey={onTrustKey} open={showTrustKeyModal} />
    </>
  );
};

export default ThreadEncryptionBadge;
