import { Icon, Typography } from 'nightwatch-ui';
import { CopyToClipboardButton, useToast } from 'skiff-front-utils';
import { DnsRecord, DnsRecordType } from 'skiff-graphql';
import styled from 'styled-components';

const DnsRecordRowContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0px;
  gap: 3.33%;

  width: 100%;
  height: 40px;
`;

const ValueDescriptionContainer = styled.div<{ $width: number }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 2px 0px;

  height: 40px;

  ${(props) => `
    min-width: ${props.$width}%;
  `}
`;

const StyledCopyToClipboardButton = styled(CopyToClipboardButton)`
  margin-left: auto;
`;

interface DnsRecordRowProps {
  dnsRecord: DnsRecord;
}

interface ValueDescriptionTextProps {
  value: string;
  description: string;
  width?: 'normal' | 'short' | 'long';
}
// Small sub-component with Value and Description stacked text
const ValueDescriptionText: React.FC<ValueDescriptionTextProps> = ({
  value,
  description,
  width = 'normal'
}: ValueDescriptionTextProps) => {
  const getWidthPx = () => {
    switch (width) {
      case 'short':
        return 8;
      case 'normal':
        return 24;
      case 'long':
        return 36;
    }
  };

  return (
    <ValueDescriptionContainer $width={getWidthPx()}>
      <Typography>{value}</Typography>
      <Typography color='secondary' level={3} type='paragraph'>
        {description}
      </Typography>
    </ValueDescriptionContainer>
  );
};

// TODO: This should be fixed in the backend, with DnsRecordType containing a priority value
function getValueAndPriority(data: string, type: DnsRecordType) {
  if (type === DnsRecordType.Mx) {
    const [priority, value] = data.split(' ');
    return { value, priority };
  }
  return { value: data, priority: 'N/A' };
}

const DnsRecordRow: React.FC<DnsRecordRowProps> = ({ dnsRecord }: DnsRecordRowProps) => {
  const { data, name, type } = dnsRecord;
  const { value, priority } = getValueAndPriority(data, type);

  const { enqueueToast } = useToast();

  const copyValueToClipboard = () => {
    void navigator.clipboard.writeText(data);
    enqueueToast({
      body: 'Record copied',
      icon: Icon.Link
    });
  };

  return (
    <DnsRecordRowContainer>
      <ValueDescriptionText description='Type' value={type} width='short' />
      <ValueDescriptionText description='Name' value={name} />
      <ValueDescriptionText description='Priority' value={priority} width='short' />
      <ValueDescriptionText description='Value' value={value} width='long' />
      <StyledCopyToClipboardButton onClick={copyValueToClipboard} />
    </DnsRecordRowContainer>
  );
};

export default DnsRecordRow;
