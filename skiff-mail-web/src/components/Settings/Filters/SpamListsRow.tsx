import { Dropdown, DropdownItem, Icon, IconText, Size, Type, Typography } from 'nightwatch-ui';
import { useRef, useState } from 'react';
import {
  SpamListsDocument,
  useMarkNotSpamMultipleEmailAddressesMutation,
  useMarkSpamMultipleEmailAddressesMutation,
  useSilenceMultipleEmailAddressesMutation
} from 'skiff-front-graphql';
import { UserAvatar } from 'skiff-front-utils';
import styled from 'styled-components';

import { UserType } from './SpamLists.consts';

const OneThirdCol = styled.div`
  width: 33%;
  display: flex;
  justify-content: flex-end;
  box-sizing: border-box;
  overflow: hidden;
`;

const TwoThirdCol = styled.div`
  width: 66%;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
`;

const RowContainer = styled.div<{ $isLast?: boolean }>`
  display: flex;
  padding: 16px 12px;
  height: 60px;
  border-bottom: ${({ $isLast }) => ($isLast ? 'none' : '1px solid var(--border-tertiary)')};
  gap: 12px;
  box-sizing: border-box;
  justify-content: space-between;
  cursor: pointer;
  :hover {
    background: var(--bg-overlay-quaternary);
  }
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SenderName = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

type DropdownOption = {
  icon: Icon;
  label: string;
  onClick: () => void;
  allowedTypes: UserType[];
};

interface SpamListRow {
  sender: string;
  isLast: boolean;
  userType: UserType;
}

export const SpamListsRow = (props: SpamListRow) => {
  const { sender, isLast, userType } = props;
  const overflowRef = useRef<HTMLDivElement>(null);
  const [openMoreDropdown, setOpenMoreDropdown] = useState(false);

  const [silenceEmailAddresses] = useSilenceMultipleEmailAddressesMutation();
  const [markAsSpam] = useMarkSpamMultipleEmailAddressesMutation();
  const [notSpam] = useMarkNotSpamMultipleEmailAddressesMutation();

  const silenceSender = async (emailAddressToBlock: string) => {
    await silenceEmailAddresses({
      variables: {
        request: {
          emailAddressesToSilence: [emailAddressToBlock]
        }
      },
      refetchQueries: [{ query: SpamListsDocument }]
    });
  };

  const markAsSpamSender = async (emailAddressToBlock: string) => {
    await markAsSpam({
      variables: {
        request: {
          emailAddressesToMarkSpam: [emailAddressToBlock]
        }
      },
      refetchQueries: [{ query: SpamListsDocument }]
    });
  };

  const notSpamSender = async (emailAddressToBlock: string) => {
    await notSpam({
      variables: {
        request: {
          emailAddressesToMarkNotSpam: [emailAddressToBlock]
        }
      },
      refetchQueries: [{ query: SpamListsDocument }]
    });
  };

  const allDropdownOptions: Array<DropdownOption> = [
    {
      icon: Icon.SoundSlash,
      label: 'Silence',
      onClick: () => void silenceSender(sender),
      allowedTypes: [UserType.ALLOWED]
    },
    {
      icon: Icon.Spam,
      label: 'Mark as spam',
      onClick: () => void markAsSpamSender(sender),
      allowedTypes: [UserType.ALLOWED]
    },
    { icon: Icon.Remove, label: 'Not spam', onClick: () => void notSpamSender(sender), allowedTypes: [UserType.SPAM] }
  ];

  const availableOptions = allDropdownOptions.filter((option) => option.allowedTypes.includes(userType));

  return (
    <RowContainer $isLast={isLast}>
      <TwoThirdCol>
        <UserAvatar label={sender} size={Size.X_MEDIUM} />
        <SenderName>
          <Typography selectable={false}>{sender}</Typography>
        </SenderName>
      </TwoThirdCol>
      <OneThirdCol>
        <ButtonGroup>
          {availableOptions.length > 0 && (
            <IconText
              color={Type.SECONDARY}
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setOpenMoreDropdown(true);
              }}
              ref={overflowRef}
              startIcon={Icon.OverflowH}
            />
          )}
        </ButtonGroup>
        <Dropdown
          buttonRef={overflowRef}
          gapFromAnchor={6}
          minWidth={175}
          portal
          setShowDropdown={setOpenMoreDropdown}
          showDropdown={openMoreDropdown}
        >
          {availableOptions.map((option) => (
            <DropdownItem
              icon={option.icon}
              key={option.label}
              label={option.label}
              onClick={() => {
                void option.onClick();
                setOpenMoreDropdown(false);
              }}
            />
          ))}
        </Dropdown>
      </OneThirdCol>
    </RowContainer>
  );
};
