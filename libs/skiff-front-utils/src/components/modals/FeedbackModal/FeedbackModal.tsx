import {
  Button,
  Dialog,
  FilledVariant,
  Icon,
  IconButton,
  Size,
  TextArea,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React, { useReducer, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import {
  SKIFF_DISCORD,
  SKIFF_PUBLIC_WEBSITE_FAQ,
  SKIFF_PUBLIC_WEBSITE_VIDEOS
} from '../../../constants/routes.constants';
import { useToast } from '../../../hooks';
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

const ErrorMessageSpace = styled.div`
  height: 12px;
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

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  sendFeedback: (feedbackText: string, attachedFiles?: File[]) => Promise<void>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose, sendFeedback }: FeedbackModalProps) => {
  const [files, updateFiles] = useReducer(filesReducer, {} as Record<string, File>);
  const [isDrafting, setIsDrafting] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [error, setError] = useState('');

  const { enqueueToast } = useToast();

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
      await sendFeedback(feedbackText, Object.values(files));
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

  return (
    <Dialog customContent onClose={onClose} open={open}>
      <FeedbackTopRow>
        <Typography mono uppercase size={TypographySize.H3} weight={TypographyWeight.BOLD}>
          Send us feedback
        </Typography>
        {isMobile && (
          <IconButton icon={Icon.Close} onClick={onClose} size={Size.SMALL} variant={FilledVariant.UNFILLED} />
        )}
      </FeedbackTopRow>
      <Typography mono uppercase wrap>
        Watch&nbsp;
        <a href={SKIFF_PUBLIC_WEBSITE_VIDEOS} rel='noopener noreferrer' target='_blank'>
          video tutorials
        </a>
        ,&nbsp;read Skiff&apos;s&nbsp;
        <a href={SKIFF_PUBLIC_WEBSITE_FAQ} rel='noopener noreferrer' target='_blank'>
          FAQs
        </a>
        ,&nbsp;or join our&nbsp;
        <a href={SKIFF_DISCORD} rel='noopener noreferrer' target='_blank'>
          Discord
        </a>
        &nbsp;for community help.
      </Typography>
      <TextArea
        autoFocus
        error={!!error}
        errorMsg={error}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setError('');
          setFeedbackText(e.target.value);
        }}
        placeholder='How can we improve Skiff?'
        value={feedbackText}
      />
      {!error && <ErrorMessageSpace />}
      {Object.keys(files).length > 0 && (
        <FileList files={files} onFileRemoved={(fileID) => updateFiles({ type: 'REMOVE', fileID })} />
      )}
      <FeedbackButtons>
        <FileImport
          acceptedFileTypes={[
            FileMimeTypesOrExtensions.GIF,
            FileMimeTypesOrExtensions.PNG,
            FileMimeTypesOrExtensions.JPEG
          ]}
          compact
          label='Attach images less than 10 MB'
          labelIcon={Icon.Link}
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
        <div>
          <Button
            loading={!isDrafting}
            onClick={() => {
              void submit();
            }}
          >
            Send feedback
          </Button>
        </div>
      </FeedbackButtons>
    </Dialog>
  );
};

export default FeedbackModal;
