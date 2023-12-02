import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { Icon, Icons, Tooltip, TooltipContent, TooltipTrigger } from 'nightwatch-ui';
import { DnsRecord } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import {
  DnsRecordColumnHeader,
  DnsRecordColumnWithPossibleError,
  getErrorDataForDnsRecordValue,
  getErrorStatusForDnsRecord,
  getValueAndPriority,
  UserFacingCustomDomainStatus
} from '../../../utils/customDomainUtils';

import ValueDescriptionText from './ValueDescriptionText';

export const DnsRecordRowContainer = styled.div<{
  showErrorStyling?: boolean;
  errorDetailView?: boolean;
  isHeader?: boolean;
}>`
  display: flex;
  align-items: ${(props) => (props.errorDetailView ? 'flex-start' : 'center')};
  padding: ${(props) => (props.errorDetailView ? '6' : '4')}px 8px;
  border-radius: 4px;
  gap: ${(props) => (props.errorDetailView ? '3.33' : '2.5')}%;
  ${(props) =>
    !props.isHeader &&
    (props.errorDetailView || props.showErrorStyling) &&
    css`
      background: var(--bg-overlay-tertiary);
    `}
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  width: 2%; // shared with 4x ValueDescriptionText
`;

interface DnsRecordRowProps {
  dnsRecord: DnsRecord;
  domainStatus: UserFacingCustomDomainStatus | undefined; // undefined on initial setup before verification
  errorDetailView?: boolean; // whether this row is part of an expanded view highlighting specific errors
  openResolve?: () => void;
}

const DnsRecordRow: React.FC<DnsRecordRowProps> = ({
  dnsRecord,
  domainStatus,
  errorDetailView,
  openResolve
}: DnsRecordRowProps) => {
  const { data, name, type } = dnsRecord;
  const { value = '', priority = '' } = getValueAndPriority(data, type);
  // whether to highlight errors with in-line color changes
  const showErrorStyling =
    domainStatus && !errorDetailView ? getErrorStatusForDnsRecord(domainStatus, dnsRecord) : false;
  // data used to highlight specific incorrect records in the error detail view
  const getErrorData = (valueType: DnsRecordColumnWithPossibleError) =>
    errorDetailView && domainStatus ? getErrorDataForDnsRecordValue(dnsRecord, valueType, domainStatus) : undefined;

  return (
    <DnsRecordRowContainer errorDetailView={errorDetailView} showErrorStyling={showErrorStyling}>
      <ValueDescriptionText
        errorDetailView={errorDetailView}
        headerName={DnsRecordColumnHeader.TYPE}
        showErrorStyling={showErrorStyling}
        value={type}
        width='short'
      />
      <ValueDescriptionText
        errorDetailView={errorDetailView}
        headerName={DnsRecordColumnHeader.NAME}
        showErrorStyling={showErrorStyling}
        value={name}
      />
      {/**error data only shown on priority and value fields */}
      <ValueDescriptionText
        errorDetailView={errorDetailView}
        headerName={DnsRecordColumnHeader.PRIORITY}
        incorrectData={getErrorData(DnsRecordColumnHeader.PRIORITY)}
        showErrorStyling={showErrorStyling}
        value={priority}
        width='short'
      />
      <ValueDescriptionText
        errorDetailView={errorDetailView}
        headerName={DnsRecordColumnHeader.VALUE}
        incorrectData={getErrorData(DnsRecordColumnHeader.VALUE)}
        showErrorStyling={showErrorStyling}
        value={value}
        width='long'
      />
      {/* allocate space for the error icon in standard table */}
      {!errorDetailView && (
        <FloatingDelayGroup delay={{ open: 100, close: 0 }}>
          <Tooltip>
            <TooltipContent>Fix error</TooltipContent>
            <TooltipTrigger>
              <IconContainer onClick={openResolve}>
                {showErrorStyling && <Icons color='red' icon={Icon.Warning} />}
              </IconContainer>
            </TooltipTrigger>
          </Tooltip>
        </FloatingDelayGroup>
      )}
    </DnsRecordRowContainer>
  );
};

export default DnsRecordRow;
