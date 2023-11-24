import {
  Button,
  Color,
  Dialog,
  DialogType,
  FilledVariant,
  Icon,
  IconButton,
  IconColor,
  IconText,
  Icons,
  Size,
  TextArea,
  Type,
  Typography,
  TypographySize,
  TypographyWeight,
  InputFieldVariant
} from 'nightwatch-ui';
import React, { useReducer, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FeedbackCategoryEnum } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import { useToast } from '../../../hooks';
import Checkbox from '../../Checkbox';
import { FileImport, FileMimeTypesOrExtensions } from '../../FileImport';
import FileList from '../../FileList/FileList';

const FeedbackTopRow = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
`;

const FeedbackButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

type FileReducerAction =
  | {
      type: 'ADD';
      newFiles: File[];
    }
  | {
      type: 'REMOVE';
      fileID: string;
    }
  | {
      type: 'REMOVE_ALL';
    };

const filesReducer = (files: Record<string, File>, action: FileReducerAction) => {
  if (action.type === 'ADD') {
    action.newFiles.forEach((file: File) => {
      files[uuidv4()] = file;
    });
  } else if (action.type === 'REMOVE') {
    delete files[action.fileID];
  } else if (action.type === 'REMOVE_ALL') {
    files = {};
  }
  return { ...files };
};

const TabChip = styled.div<{ $selected?: boolean }>`
  display: flex;
  box-sizing: border-box;
  padding: 4px;
  align-items: center;
  border-radius: 32px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? 'var(--bg-overlay-tertiary)' : 'transparent')};

  border: 1px solid ${({ $selected }) => ($selected ? 'var(--border-primary)' : 'var(--border-secondary)')};
  :hover {
    background: var(--bg-overlay-tertiary);
  }
`;

const LabelContainer = styled.div`
  display: flex;
  padding: 0px 8px;
  justify-content: center;
  align-items: center;
`;

const IconContainer = styled.div<{ $bgColor?: string }>`
  border-radius: 100px;
  display: flex;
  width: 20px;
  height: 20px;
  padding: 3px;
  box-sizing: border-box;
  background: ${({ $bgColor }) => $bgColor};
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
`;

const TabChips = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 4px;
  margin: 0 -6px;
  width: fit-content;
  padding: 4px 6px;
  user-select: none;
  :hover {
    cursor: pointer;
    background: var(--bg-overlay-tertiary);
  }
`;

const TextContainer = styled.div`
  overflow-y: auto;
  background: var(--bg-field-default);
  padding: 8px 12px;
  border-radius: 8px 8px 0px 0px;
  cursor: text;
  max-height: calc(55vh - 44px);
  width: 100%;
  box-sizing: border-box;
  color: var(--text-primary);
  caret-color: var(--icon-link);
  ::placeholder {
    color: var(--text-disabled);
  }
`;

const Footer = styled.div`
  width: 100%;
  justify-content: space-between;
  display: flex;
  align-items: center;
  background: var(--bg-field-default);
  padding: 8px 12px;
  border-radius: 0px 0px 8px 8px;
  box-sizing: border-box;
`;

const Inline = styled.div`
  display: flex;
  align-items: center;
`;

const FixedGap = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
  width: 100%;
`;

const UrgentBanner = styled.div`
  display: flex;
  padding: 12px 10px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;
  border-radius: 6px;
  background: var(--accent-orange-secondary);
`;

const PriorityBanner = styled.div`
  display: flex;
  padding: 12px 10px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  gap: 8px;
  border-radius: 6px;
  background: var(--accent-blue-secondary);
`;

const FixedHeight = styled.div`
  height: 52px;
  display: flex;
  width: 100%;
  align-items: center;
`;

const TextFooter = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const RequestButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 173px;
`;

const RequestButton = styled.div`
  display: flex;
  height: 100%;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--border-secondary);
  background: var(--bg-l3-solid);
  :hover {
    background: var(--bg-overlay-tertiary);
  }
  cursor: pointer;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 16px;
`;

const RequestButtonText = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2px;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RequestIconContainer = styled.div<{ $bgColor?: string }>`
  width: 42px;
  height: 42px;
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border-secondary);
  background: ${({ $bgColor }) => $bgColor || 'var(--bg-l0-solid)'};
`;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  sendFeedback: (
    feedbackText: string,
    isUrgent: boolean,
    requestType: FeedbackCategoryEnum,
    attachedFiles?: File[]
  ) => Promise<void>;
  openSupportCompose?: () => void;
}

interface FeedbackCategory {
  label: FeedbackCategoryEnum;
  icon: Icon;
  labelColor?: Color;
  iconColor?: IconColor;
  iconBgColor?: string;
  placeholder?: string;
}

const SKIFF_HELP_URL = 'https://skiff.com/help';

const TabChipComponent: React.FC<FeedbackCategory & { onClick?: () => void; selected?: boolean }> = ({
  label,
  icon,
  onClick,
  iconColor = 'disabled',
  labelColor = 'secondary',
  iconBgColor,
  selected
}) => {
  return (
    <TabChip $selected={selected} onClick={onClick}>
      <IconContainer $bgColor={iconBgColor}>
        <Icons color={iconColor} icon={icon} size={14} />
      </IconContainer>
      <LabelContainer>
        <Typography color={selected ? 'primary' : labelColor}>{upperCaseFirstLetter(label)}</Typography>
      </LabelContainer>
    </TabChip>
  );
};

const FEEDBACK_CATEGORIES: Array<FeedbackCategory> = [
  {
    label: FeedbackCategoryEnum.Question,
    icon: Icon.QuestionCircle,
    iconBgColor: 'var(--bg-overlay-tertiary)',
    placeholder: 'Please describe what you would like help with...'
  },
  {
    label: FeedbackCategoryEnum.Request,
    icon: Icon.Lightbulb,
    iconColor: 'yellow',
    iconBgColor: 'var(--accent-yellow-secondary)',
    placeholder: 'Please describe your feedback or feature request...'
  },
  {
    label: FeedbackCategoryEnum.Bug,
    icon: Icon.Bug,
    iconColor: 'destructive',
    iconBgColor: 'var(--accent-red-secondary)',
    placeholder: 'Please describe the issue...'
  },
  {
    label: FeedbackCategoryEnum.Billing,
    icon: Icon.Currency,
    iconColor: 'green',
    iconBgColor: 'var(--accent-green-secondary)',
    placeholder: 'Please describe the billing issue...'
  }
];

const CANNY_URL = 'https://skiff.canny.io/feature-requests';

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onClose,
  sendFeedback,
  openSupportCompose
}: FeedbackModalProps) => {
  const [files, updateFiles] = useReducer(filesReducer, {} as Record<string, File>);
  const [requestTextSelected, setRequestTextSelected] = useState(false);
  const [isDrafting, setIsDrafting] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [error, setError] = useState('');
  const [isUrgentIssue, setIsUrgentIssue] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const { enqueueToast } = useToast();

  const openCanny = () => {
    window.open(CANNY_URL, '_blank', 'noopener noreferrer');
  };

  const showRequestText = () => {
    setRequestTextSelected(true);
  };

  const selectedCategoryName = FEEDBACK_CATEGORIES[selectedCategoryIndex].label;

  /**
   * Handles feedback submission.
   * If there are attached media files, these are uploaded to our Zendesk cloud.
   * These uploads are then linked to the feedback ticket, which is created via the SendFeedbackDocument GraphQL mutation.
   * End result is a newly-created Zendesk ticket with associated responses and media.
   */
  async function submit() {
    if (!feedbackText) {
      setError('Please enter feedback');
      return;
    }

    try {
      setIsDrafting(false);
      await sendFeedback(feedbackText, isUrgentIssue, selectedCategoryName, Object.values(files));
      enqueueToast({
        title: 'Feedback sent',
        body: "We'll get back to you shortly."
      });
      onClose();
    } catch (e) {
      setError('Feedback failed to send. Please try again.');
      console.error(e);
      setIsDrafting(true);
    }
  }

  const renderTextArea = () => {
    return (
      <TextFooter>
        <TextContainer>
          <TextArea
            autoFocus
            dynamicHeight
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setError('');
              setFeedbackText(e.target.value);
            }}
            placeholder={FEEDBACK_CATEGORIES[selectedCategoryIndex].placeholder}
            rows={5}
            value={feedbackText}
            variant={InputFieldVariant.GHOST}
          />
        </TextContainer>
        <Footer>
          <Left>
            {selectedCategoryName === FeedbackCategoryEnum.Bug && (
              <CheckLabel onClick={() => setIsUrgentIssue((prev) => !prev)}>
                <Checkbox
                  checked={isUrgentIssue}
                  hover={false}
                  onClick={(e) => {
                    e?.stopPropagation();
                    setIsUrgentIssue((prev) => !prev);
                  }}
                />
                <Typography color='secondary'>This issue is urgent</Typography>
              </CheckLabel>
            )}
            {selectedCategoryName === FeedbackCategoryEnum.Request && requestTextSelected && (
              <CheckLabel onClick={() => setRequestTextSelected(false)}>
                <Typography color='secondary'>Back</Typography>
              </CheckLabel>
            )}
            {error && (
              <Typography color='destructive' size={TypographySize.SMALL}>
                {selectedCategoryName === FeedbackCategoryEnum.Bug ||
                (selectedCategoryName === FeedbackCategoryEnum.Request && requestTextSelected)
                  ? '• '
                  : ''}
                {error}
              </Typography>
            )}
          </Left>
          {selectedCategoryName !== FeedbackCategoryEnum.Bug && <div />}
          <FileImport
            acceptedFileTypes={[
              FileMimeTypesOrExtensions.GIF,
              FileMimeTypesOrExtensions.PNG,
              FileMimeTypesOrExtensions.JPEG
            ]}
            compact
            label='Add files'
            maxFileSizeMegabytes={10}
            // for users with large screens which generate large screenshots
            onFilesAdded={(newFiles) => {
              if (!isDrafting) {
                return;
              }
              updateFiles({ type: 'ADD', newFiles });
            }}
            variant='SELECT'
          />
        </Footer>
      </TextFooter>
    );
  };

  const renderRequestButtons = () => {
    return (
      <RequestButtons>
        <RequestButton onClick={openCanny}>
          <RequestIconContainer $bgColor='#555CF0'>
            <Icons color='white' icon={Icon.CommentPlus} />
          </RequestIconContainer>
          <RequestButtonText>
            <Typography>Submit roadmap proposal (recommended)</Typography>
            <Typography color='secondary'>Request a new feature via Canny</Typography>
          </RequestButtonText>
          <Icons color='disabled' icon={Icon.ChevronRight} />
        </RequestButton>
        <RequestButton onClick={showRequestText}>
          <RequestIconContainer>
            <Icons color='secondary' icon={Icon.Send} />
          </RequestIconContainer>
          <RequestButtonText>
            <Typography>Send suggestion</Typography>
            <Typography color='secondary'>Suggest an idea to the Skiff Team</Typography>
          </RequestButtonText>
          <Icons color='disabled' icon={Icon.ChevronRight} />
        </RequestButton>
      </RequestButtons>
    );
  };

  return (
    <Dialog customContent onClose={onClose} open={open} type={DialogType.LANDSCAPE}>
      <FeedbackTopRow>
        <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
          Contact Skiff team
        </Typography>
        {isMobile && (
          <IconButton icon={Icon.Close} onClick={onClose} size={Size.SMALL} variant={FilledVariant.UNFILLED} />
        )}
      </FeedbackTopRow>
      <TabChips>
        {FEEDBACK_CATEGORIES.map((category, index) => {
          const { label, icon, iconColor, iconBgColor } = category;
          return (
            <TabChipComponent
              icon={icon}
              iconBgColor={iconBgColor}
              iconColor={iconColor}
              key={label}
              label={label}
              onClick={() => {
                if (index === selectedCategoryIndex) return;
                setSelectedCategoryIndex(index);
                setError('');
              }}
              selected={index === selectedCategoryIndex}
            />
          );
        })}
      </TabChips>
      <FixedGap>
        {selectedCategoryName === FeedbackCategoryEnum.Request && !requestTextSelected && renderRequestButtons()}
        {([FeedbackCategoryEnum.Bug, FeedbackCategoryEnum.Billing, FeedbackCategoryEnum.Question].includes(
          selectedCategoryName
        ) ||
          requestTextSelected) &&
          renderTextArea()}
        {Object.keys(files).length > 0 && (
          <FileList files={files} onFileRemoved={(fileID) => updateFiles({ type: 'REMOVE', fileID })} />
        )}
        <FixedHeight>
          {isUrgentIssue && selectedCategoryName === FeedbackCategoryEnum.Bug && (
            <UrgentBanner>
              <IconText
                color='secondary'
                label='Please include steps to reproduce the issue.'
                startIcon={Icon.Warning}
                weight={TypographyWeight.REGULAR}
              />
            </UrgentBanner>
          )}
        </FixedHeight>
        <FeedbackButtons>
          <Inline>
            <Typography color='secondary' size={TypographySize.SMALL}>
              You can also email us at&nbsp;
            </Typography>
            <Typography
              color={!!openSupportCompose ? 'link' : 'secondary'}
              onClick={() => {
                if (!!openSupportCompose) {
                  openSupportCompose();
                  onClose();
                }
              }}
              size={TypographySize.SMALL}
            >
              support@skiff.org
            </Typography>
          </Inline>
          <ButtonGroup>
            <Button
              onClick={() => {
                window.open(SKIFF_HELP_URL, '_blank', 'noopener noreferrer');
              }}
              type={Type.SECONDARY}
            >
              Help center
            </Button>
            <Button
              loading={!isDrafting}
              onClick={() => {
                void submit();
              }}
            >
              Send
            </Button>
          </ButtonGroup>
        </FeedbackButtons>
      </FixedGap>
    </Dialog>
  );
};

export default FeedbackModal;
