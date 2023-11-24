import { ButtonGroup, ButtonGroupItem, Icon, Icons, Size } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useGetEmailImportMetaQuery } from 'skiff-front-graphql';
import { Illustration, Illustrations } from 'skiff-front-utils';
import { EmailImportDateRange, EmailImportDateRangeType, ImportClients } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { ImportMailStepHeader } from './ImportMailStepHeader';

const IllustrationContainer = styled.div`
  ${!isMobile && 'height: 148px;'}
  ${isMobile &&
  css`
    display: flex;
    align-self: stretch;
    justify-content: center;
    align-items: center;
  `}
`;

const MobileIconContainer = styled.div`
  display: flex;
  width: 72px;
  height: 72px;
  padding: 18px;
  justify-content: center;
  align-items: center;
  border-radius: 36px;
  background: var(--bg-l1-solid);
  box-sizing: border-box;
`;

interface ConfirmImportProps {
  importClient: ImportClients;
  onBack: () => void;
  onContinue: () => void;
  importID?: string;
  selectedDateRange?: EmailImportDateRange;
}

export const ConfirmImport: React.FC<ConfirmImportProps> = ({
  importClient,
  onBack,
  onContinue,
  importID,
  selectedDateRange
}: ConfirmImportProps) => {
  // Get the estimated number of emails to import
  // TODO: factor in the labels/folders selected
  const { data } = useGetEmailImportMetaQuery({
    variables: {
      request: {
        client: importClient,
        importID: importID ?? '',
        dateRange: selectedDateRange ?? {
          rangeType: EmailImportDateRangeType.Last_3Months,
          clientTimeZone: ''
        }
      }
    },
    // Skip for Gmail, as the Gmail API does not provide reliable count estimates
    skip: !importID || !selectedDateRange || importClient === ImportClients.Gmail
  });
  const numMessagesToImport =
    importClient === ImportClients.Gmail || importClient === ImportClients.Outlook
      ? undefined
      : data?.emailImportMeta.estimatedEmailCount;

  return (
    <>
      <ImportMailStepHeader
        description='The import may take up to a few hours. You can log out or close your browser without disrupting the import.'
        itemLabel='message'
        numItems={numMessagesToImport}
        title='Confirm import'
      />
      {!isMobile && (
        <IllustrationContainer>
          <Illustration illustration={Illustrations.ImportMail} />
        </IllustrationContainer>
      )}
      {isMobile && (
        <IllustrationContainer>
          <MobileIconContainer>
            <Icons color='secondary' icon={Icon.EnvelopeUnread} size={Size.LARGE} />
          </MobileIconContainer>
        </IllustrationContainer>
      )}
      <ButtonGroup>
        <ButtonGroupItem label='Confirm' onClick={onContinue} />
        <ButtonGroupItem label='Back' onClick={onBack} />
      </ButtonGroup>
    </>
  );
};
