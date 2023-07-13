import { ButtonGroup, ButtonGroupItem, Dialog, DialogTypes, Layout, TextArea, Typography } from '@skiff-org/skiff-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useApplyLabelsMutation, useGetThreadFromIdLazyQuery, useUploadSpamReportMutation } from 'skiff-front-graphql';
import { useToast, Checkbox } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import {
  ModalType,
  ReportPhishingOrConcernModal as IReportPhishingOrConcernModal,
  ReportPhishingOrConcernType
} from '../../redux/reducers/modalTypes';
import { updateThreadsWithModifiedLabels } from '../../utils/cache/cache';
import { getRawMime } from '../../utils/eml';

const InputContainer = styled.div`
  margin-top: 12px;
  width: 100%;
`;

const EMLCheckbox = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 4px 0 8px 0;
`;

export const ReportPhishingOrConcernModal = () => {
  const { openModal } = useAppSelector((state) => state.modal);

  const [concernResponse, setConcernResponse] = useState<string>('');
  const [includeEML, setIncludeEML] = useState(true);

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    setConcernResponse('');
  };

  const { enqueueToast } = useToast();

  const open = openModal?.type === ModalType.ReportPhishingOrConcern;
  const { threadID, emailID, fromAddress, systemLabels } = open ? openModal : ({} as IReportPhishingOrConcernModal);

  const isReportPhishing = open && openModal.purpose === ReportPhishingOrConcernType.Phishing;
  const isReportConcern = open && openModal.purpose === ReportPhishingOrConcernType.Concern;

  const { setActiveThreadID } = useThreadActions();

  const getTitle = () => {
    if (isReportPhishing) {
      return 'Report phishing';
    }
    if (isReportConcern) {
      return 'Report a concern';
    }
    return '';
  };

  const isThreadSpam = systemLabels?.includes(SystemLabels.Spam);

  const getDescription = (): string | undefined =>
    `Reporting this conversation${
      !isThreadSpam ? ' moves it to spam and ' : ' '
    } optionally shares the email with the Skiff Security Team.`;

  const [uploadSpamReportMutation] = useUploadSpamReportMutation();
  const [applyLabels] = useApplyLabelsMutation();
  const [getThreadFromID] = useGetThreadFromIdLazyQuery();

  const moveThread = async (systemLabel: SystemLabels) => {
    await applyLabels({
      variables: {
        request: {
          threadIDs: [threadID],
          systemLabels: [systemLabel]
        }
      },
      update: (cache, response) =>
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });
    setActiveThreadID(undefined);
  };

  // Upload EML of reported email to S3
  const uploadReportToS3 = async () => {
    // Fetch the email given the thread ID.
    // We need the email object to get the raw mime
    const threadData = await getThreadFromID({ variables: { threadID } });
    const email = threadData.data?.userThread?.emails.find((e) => e.id === emailID);

    if (!email) {
      console.error('email to report not found');
      return;
    }

    const { encryptedRawMimeUrl, decryptedSessionKey } = email;
    let rawMime: string | undefined = undefined;
    if (!encryptedRawMimeUrl || !decryptedSessionKey) {
      console.error('missing encryptedRawMimeUrl or decryptedSessionKey fields');
      // if we can't get the raw mime of the email, still report and log infromation on backend
    } else {
      rawMime = await getRawMime(encryptedRawMimeUrl, decryptedSessionKey);
    }

    await uploadSpamReportMutation({
      variables: {
        request: {
          emailID: emailID,
          rawMime: rawMime,
          threadID: threadID,
          fromAddress: fromAddress
        }
      }
    });
  };

  const onReportClick = async () => {
    try {
      onClose();

      // Move thread to spam if it is not already in spam. Otherwise set
      // the active thread ID to undefined to close the reported thread.
      if (!isThreadSpam) {
        await moveThread(SystemLabels.Spam);
      } else {
        setActiveThreadID(undefined);
      }

      if (includeEML) {
        await uploadReportToS3();
      }

      enqueueToast({
        title: 'Message reported',
        body: `Conversation reported${isReportPhishing ? ' as phishing' : ''}${
          !isThreadSpam ? ' and moved to Spam' : ''
        }.`
      });
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Failed to report',
        body: `Could not report conversation${isReportPhishing ? ' as phishing' : ''}. Please try again.`
      });
    }
  };

  const reportConcernField = (
    <InputContainer>
      <TextArea
        autoFocus={isMobile}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const newResponse = e.target.value;
          setConcernResponse(newResponse);
        }}
        placeholder='Provide as much detail as possible'
        value={concernResponse}
      />
    </InputContainer>
  );

  return (
    <Dialog
      customContent
      description={getDescription()}
      inputField={isReportConcern ? reportConcernField : undefined}
      onClose={onClose}
      open={open}
      title={getTitle()}
      type={DialogTypes.Confirm}
    >
      <EMLCheckbox>
        <Checkbox
          checked={includeEML}
          onClick={() => {
            setIncludeEML((currIncludeEMLState) => !currIncludeEMLState);
          }}
        />
        <Typography>Include email contents</Typography>
      </EMLCheckbox>
      <ButtonGroup layout={isMobile ? Layout.STACKED : Layout.INLINE}>
        <ButtonGroupItem
          key={`report-${isReportPhishing ? 'phishing' : 'concern'}`}
          label='Report'
          onClick={() => void onReportClick()}
        />
        <ButtonGroupItem key={`cancel-${isReportPhishing ? 'phishing' : 'concern'}`} label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};

export default ReportPhishingOrConcernModal;
