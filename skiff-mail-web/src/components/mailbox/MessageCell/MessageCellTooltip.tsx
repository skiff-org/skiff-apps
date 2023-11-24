import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import {
  CorrectedColorSelect,
  Divider,
  FilledVariant,
  Icon,
  IconText,
  Icons,
  Portal,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  accentColorToPrimaryColor,
  getThemedColor
} from 'nightwatch-ui';
import React from 'react';
import { useDispatch } from 'react-redux';
import {
  SettingValue,
  TabPage,
  copyToClipboardWebAndMobile,
  getContactWithoutTypename,
  useGetContactWithEmailAddress,
  useToast
} from 'skiff-front-utils';
import { AccentColor, DisplayPictureData } from 'skiff-graphql';
import styled from 'styled-components';
import { v4 } from 'uuid';

import client from '../../../apollo/client';
import { useDisplayPictureWithDefaultFallback } from '../../../hooks/useDisplayPictureDataFromAddress';
import { useDrafts } from '../../../hooks/useDrafts';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { useSettings } from '../../Settings/useSettings';

import { MessageCellAvatar } from './MessageCellAvatar';

dayjs.extend(isToday);

const UserTooltipContainer = styled.div<{ $top: number; $left: number }>`
  display: flex;
  flex-direction: column;
  padding: 8px;
  border-radius: 8px;
  gap: 12px;
  min-width: fit-content;
  width: 375px;
  max-width: 600px;
  z-index: 9999999;
  overflow: hidden;
  position: absolute;
  top: ${(props: { $top: number }) => props.$top + 22}px;
  left: ${(props: { $left: number }) => props.$left}px;
  box-shadow: ${getThemedColor('var(--shadow-l3)', ThemeMode.DARK)};
  background: ${getThemedColor('var(--bg-l3-solid)', ThemeMode.DARK)};
`;

const UserTooltipButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftButtons = styled.div`
  display: flex;
  position: relative;
  z-index: 99999999999999;
  align-items: center;
  gap: 8px;
`;

const RightButtons = styled.div`
  display: flex;
  position: relative;
  z-index: 99999999999999;
  align-items: center;
  gap: 8px;
`;

const DisplayNameAddress = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 8px;
`;

const AvatarName = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-left: 4px;
  margin-top: 4px;
`;

const ColorBackdrop = styled.div<{ $accentColor: AccentColor }>`
  background: ${(props) =>
    CorrectedColorSelect[accentColorToPrimaryColor[props.$accentColor] as string] || 'var(--accent-primary-orange)'};
  min-width: fit-content;
  width: 100%;
  height: 42px;
  border-radius: 4px;
`;

const BackdropContainerAbsolute = styled.div`
  position: absolute;
  overflow: hidden;
  width: calc(100% - 16px);
  height: 100%;
`;

const BackdropContainerRelative = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const AvatarBorder = styled.div`
  border: 2.5px solid var(--icon-always-black);
  z-index: 99999999999999999;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: ${getThemedColor('var(--shadow-l3)', ThemeMode.DARK)};
`;

const NameBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

interface MessageCellProps {
  thread: MailboxThreadInfo;
  addresses: string[];
  facepileNames: string[];
  badgeColor: string;
  tooltipIndex: number;
  isVerifiedAddress: boolean;
  left: number;
  top: number;
  setTooltipIndex: React.Dispatch<React.SetStateAction<number>>;
  setHoverOverName: React.Dispatch<React.SetStateAction<boolean>>;
  emailID?: string;
}

export const MessageCellTooltip = ({
  tooltipIndex,
  addresses,
  facepileNames,
  badgeColor,
  thread,
  isVerifiedAddress,
  left,
  top,
  setTooltipIndex,
  setHoverOverName,
  emailID
}: MessageCellProps) => {
  const dispatch = useDispatch();
  const { enqueueToast } = useToast();
  const { composeNewDraft } = useDrafts();

  const { threadID, emails } = thread;

  const { displayPictureData } = useDisplayPictureWithDefaultFallback(
    addresses[tooltipIndex],
    emails[tooltipIndex]?.id
  );

  const contact = useGetContactWithEmailAddress({ emailAddress: addresses[tooltipIndex], client });
  const directMessage = () => {
    const addressObj = emails[tooltipIndex]?.from;
    if (!addressObj) return;
    composeNewDraft();
    dispatch(skemailModalReducer.actions.directMessageCompose(addressObj));
  };
  const isContact = !!contact;
  const copyToClipboard = () => {
    if (!addresses[tooltipIndex]) return;
    copyToClipboardWebAndMobile(addresses[tooltipIndex] || '');
    enqueueToast({
      title: 'Copied to clipboard',
      body: `Copied ${addresses[tooltipIndex] || 'address'} to clipboard`
    });
  };
  const { openSettings } = useSettings();
  return (
    <Portal>
      <UserTooltipContainer $left={left} $top={top} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <BackdropContainerAbsolute>
          <BackdropContainerRelative>
            <ColorBackdrop $accentColor={(displayPictureData?.profileAccentColor || 'orange') as AccentColor} />
          </BackdropContainerRelative>
        </BackdropContainerAbsolute>
        <AvatarName>
          <AvatarBorder>
            <MessageCellAvatar
              address={addresses[tooltipIndex]}
              badgeBackground={badgeColor} // force dark mode
              customBorderRadius={1}
              forceTheme={ThemeMode.DARK}
              key={`${addresses[tooltipIndex] ?? ''}-${emailID || threadID}`}
              messageID={emails[tooltipIndex]?.id}
              senderName={facepileNames[tooltipIndex] || ''}
              size={Size.X_LARGE}
            />
          </AvatarBorder>
          <DisplayNameAddress>
            <NameBadge>
              <Typography forceTheme={ThemeMode.DARK}>{facepileNames[tooltipIndex]}</Typography>
              {isVerifiedAddress && (
                <Icons color='link' icon={Icon.VerifiedCheck} size={20} tooltip='Skiff official' tooltipDelay={0} />
              )}
            </NameBadge>
            <Typography color='secondary' forceTheme={ThemeMode.DARK}>
              {addresses[tooltipIndex]}
            </Typography>
          </DisplayNameAddress>
        </AvatarName>
        <Divider forceTheme={ThemeMode.DARK} />
        <UserTooltipButtons>
          <LeftButtons>
            {facepileNames.length > 1 && (
              <>
                <IconText
                  disabled={tooltipIndex === 0}
                  forceTheme={ThemeMode.DARK}
                  onClick={(e?: React.MouseEvent) => {
                    e?.stopPropagation();
                    setTooltipIndex((prev) => prev - 1);
                  }}
                  startIcon={Icon.ChevronLeft}
                  variant={FilledVariant.FILLED}
                />
                <IconText
                  disabled={tooltipIndex === facepileNames.length - 1}
                  forceTheme={ThemeMode.DARK}
                  onClick={(e?: React.MouseEvent) => {
                    e?.stopPropagation();
                    setTooltipIndex((prev) => prev + 1);
                  }}
                  startIcon={Icon.ChevronRight}
                  variant={FilledVariant.FILLED}
                />
                <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.CAPTION} uppercase>
                  {tooltipIndex + 1} of {facepileNames.length}
                </Typography>
              </>
            )}
          </LeftButtons>
          <RightButtons>
            <IconText
              forceTheme={ThemeMode.DARK}
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                copyToClipboard();
              }}
              startIcon={Icon.Copy}
              variant={FilledVariant.FILLED}
            />
            <IconText
              forceTheme={ThemeMode.DARK}
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                if (!isContact) {
                  const name = facepileNames[tooltipIndex];
                  const splitName = name?.split(' ');
                  const isTwoWords = splitName?.length === 2;
                  const contactContent = {
                    contactID: v4(),
                    firstName: isTwoWords ? splitName[0] : name ? name : '',
                    lastName: isTwoWords ? splitName[1] : undefined,
                    address: addresses[tooltipIndex],
                    displayPictureData: displayPictureData as DisplayPictureData
                  };
                  if (!!contactContent) {
                    dispatch(skemailModalReducer.actions.openAddContactWithContent(contactContent));
                  }
                } else {
                  dispatch(
                    skemailModalReducer.actions.openAddContactWithSelectedContact(getContactWithoutTypename(contact))
                  );
                }
                openSettings({
                  tab: TabPage.Contacts,
                  setting: SettingValue.Contacts
                });
                setHoverOverName(false);
              }}
              startIcon={isContact ? Icon.UserCircle : Icon.UserPlus}
              variant={FilledVariant.FILLED}
            />
            <IconText
              forceTheme={ThemeMode.DARK}
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                directMessage();
                setHoverOverName(false);
              }}
              startIcon={Icon.Compose}
              variant={FilledVariant.FILLED}
            />
          </RightButtons>
        </UserTooltipButtons>
      </UserTooltipContainer>
    </Portal>
  );
};
