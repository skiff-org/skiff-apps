import { ButtonGroupItem, Dialog, DialogTypes, Icon, InputField } from '@skiff-org/skiff-ui';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import {
  FeedbackType,
  SystemLabels,
  useApplyLabelsMutation,
  useGetCurrentUserEmailAliasesQuery,
  useSendFeedbackMutation
} from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import useCustomSnackbar from '../../hooks/useCustomSnackbar';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import {
  ModalType,
  ReportPhishingOrConcernModal as IReportPhishingOrConcernModal,
  ReportPhishingOrConcernType
} from '../../redux/reducers/modalTypes';
import { updateThreadsWithModifiedLabels } from '../../utils/cache';

const InputContainer = styled.div`
  margin-top: 12px;
  width: 100%;
`;

export const ReportPhishingOrConcernModal = () => {
  const { openModal } = useAppSelector((state) => state.modal);

  const [concernResponse, setConcernResponse] = useState<string>('');

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
    setConcernResponse('');
  };

  const { enqueueCustomSnackbar } = useCustomSnackbar();

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

  const isThreadSpam = systemLabels.includes(SystemLabels.Spam);

  const getDescription = (): string | undefined => {
    if (isReportPhishing) {
      return `Reporting this conversation${
        !isThreadSpam ? ' moves it to spam and ' : ' '
      }shares the sender information with the Skiff Security Team.`;
    }
    if (isReportConcern) {
      return (
        `Reporting this conversation${
          !isThreadSpam ? ' moves it to spam and ' : ' '
        }shares the sender information with the Skiff Security Team ` +
        'which will help prevent similar emails from reaching your inbox.'
      );
    }
    return '';
  };

  const user = useRequiredCurrentUserData();
  const { data: emailAliasQuery } = useGetCurrentUserEmailAliasesQuery();
  const emailAliases = emailAliasQuery?.currentUser?.emailAliases ?? [];
  const emailAlias = emailAliases?.[0] || user?.username;

  const [sendFeedbackMutation] = useSendFeedbackMutation({
    variables: {
      request: {
        type: isReportPhishing ? FeedbackType.Phishing : FeedbackType.Report,
        responses: [
          isReportPhishing ? 'Report Phishing' : 'Report a Concern',
          `Thread ID: ${threadID}\nEmail ID: ${emailID}\nSkiff email address of reporting user: ${emailAlias}\nEmail from: ${fromAddress}${
            concernResponse && '\n\n' + concernResponse
          }`
        ],
        zendeskUploadTokens: [],
        isMobile
      }
    }
  });
  const [applyLabels] = useApplyLabelsMutation();

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
      await sendFeedbackMutation();
      enqueueCustomSnackbar({
        body: `Conversation reported${isReportPhishing ? ' as phishing' : ''}${
          !isThreadSpam ? ' and moved to Spam' : ''
        }.`,
        icon: Icon.Spam
      });
    } catch (error) {
      console.error(error);
      enqueueCustomSnackbar({
        body: `Could not report conversation${isReportPhishing ? ' as phishing' : ''}. Please try again.`,
        icon: Icon.Warning
      });
    }
  };

  const reportConcernField = (
    <InputContainer>
      <InputField
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const newResponse = e.target.value;
          setConcernResponse(newResponse);
        }}
        placeholder='Please provide as much detail as possible on your concerns regarding this email.'
        textArea
        value={concernResponse}
      />
    </InputContainer>
  );

  return (
    <Dialog
      description={getDescription()}
      inputField={isReportConcern ? reportConcernField : undefined}
      onClose={onClose}
      open={open}
      title={getTitle()}
      type={DialogTypes.Confirm}
    >
      <ButtonGroupItem
        key={`report-${isReportPhishing ? 'phishing' : 'concern'}`}
        label='Report'
        onClick={onReportClick}
      />
      <ButtonGroupItem key={`cancel-${isReportPhishing ? 'phishing' : 'concern'}`} label='Cancel' onClick={onClose} />
    </Dialog>
  );
};
