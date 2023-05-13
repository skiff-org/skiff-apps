import { DnsRecordRowContainer } from './DnsRecordRow';
import ValueDescriptionText from './ValueDescriptionText';

interface DnsRecordHeaderProps {
  errorDetailView?: boolean;
}

const DnsRecordHeader: React.FC<DnsRecordHeaderProps> = ({ errorDetailView }: DnsRecordHeaderProps) => {
  return (
    <DnsRecordRowContainer errorDetailView={errorDetailView} isHeader>
      <ValueDescriptionText errorDetailView={errorDetailView} header value='Type' width='short' />
      <ValueDescriptionText errorDetailView={errorDetailView} header value='Name' />
      <ValueDescriptionText errorDetailView={errorDetailView} header value='Priority' width='short' />
      <ValueDescriptionText errorDetailView={errorDetailView} header value='Value' width='long' />
    </DnsRecordRowContainer>
  );
};

export default DnsRecordHeader;
