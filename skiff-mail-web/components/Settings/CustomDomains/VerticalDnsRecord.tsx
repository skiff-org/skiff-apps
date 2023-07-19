import { Divider, Typography, TypographySize } from '@skiff-org/skiff-ui';
import { DnsRecord } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import {
  DnsRecordColumnHeader,
  getErrorDataForDnsRecordValue,
  getValueAndPriority,
  UserFacingCustomDomainStatus
} from '../../../utils/customDomainUtils';

import ValueDescriptionText from './ValueDescriptionText';

const DividerContainer = styled.div`
  padding: 0 12px;
`;

const RowContainer = styled.div`
  display: flex;
  padding: 0 12px;
`;

const TypeValuePairContainer = styled.div`
  display: flex;
  gap: 2px;
  width: 100%;
`;

const ValueTypeContainer = styled.div`
  width: 14%;
`;

const RecordContainer = styled.div`
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

interface VerticalDnsRecordRowProps {
  valueType: string;
  value: string;
  incorrectData?: string;
}

const VerticalDnsRecordRow: React.FC<VerticalDnsRecordRowProps> = ({
  valueType,
  value,
  incorrectData
}: VerticalDnsRecordRowProps) => {
  return (
    <RowContainer>
      <TypeValuePairContainer>
        <ValueTypeContainer>
          <Typography mono uppercase color='disabled' size={TypographySize.CAPTION}>
            {upperCaseFirstLetter(valueType)}
          </Typography>
        </ValueTypeContainer>
        <ValueDescriptionText incorrectData={incorrectData} showErrorStyling={!!incorrectData} value={value} />
      </TypeValuePairContainer>
    </RowContainer>
  );
};

interface VerticalDnsRecordProps {
  dnsRecord: DnsRecord;
  domainStatus?: UserFacingCustomDomainStatus; // not defined on initial setup
}

const VerticalDnsRecord: React.FC<VerticalDnsRecordProps> = ({ dnsRecord, domainStatus }: VerticalDnsRecordProps) => {
  const { value = '', priority = 'N/A' } = getValueAndPriority(dnsRecord.data, dnsRecord.type);
  const propertiesToDisplay: Record<DnsRecordColumnHeader, string> = {
    [DnsRecordColumnHeader.TYPE]: dnsRecord.type,
    [DnsRecordColumnHeader.NAME]: dnsRecord.name,
    [DnsRecordColumnHeader.PRIORITY]: priority,
    [DnsRecordColumnHeader.VALUE]: value
  };

  return (
    <>
      <DividerContainer>
        <Divider />
      </DividerContainer>
      <RecordContainer>
        {Object.entries(propertiesToDisplay).map(([valueType, valueData]) => {
          // error data only shown on priority and value fields
          const incorrectData =
            domainStatus && (valueType === DnsRecordColumnHeader.PRIORITY || valueType === DnsRecordColumnHeader.VALUE)
              ? getErrorDataForDnsRecordValue(dnsRecord, valueType, domainStatus)
              : undefined;
          return (
            <VerticalDnsRecordRow
              incorrectData={incorrectData}
              key={valueType}
              value={valueData}
              valueType={valueType}
            />
          );
        })}
      </RecordContainer>
    </>
  );
};

export default VerticalDnsRecord;
