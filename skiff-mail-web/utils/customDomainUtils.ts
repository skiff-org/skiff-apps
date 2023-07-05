import { DnsRecord, DnsRecordType } from 'skiff-graphql';
import { CustomDomainStatus, CUSTOM_DOMAIN_RECORD_ERRORS } from 'skiff-utils';

export enum UserFacingCustomDomainStatus {
  VERIFIED = CustomDomainStatus.VERIFIED,
  PENDING = CustomDomainStatus.PENDING,
  DNS_RECORD_ERROR = 'DNS RECORD ERROR'
}

export enum DnsRecordColumnHeader {
  TYPE = 'Type',
  NAME = 'Name',
  PRIORITY = 'Priority',
  VALUE = 'Value'
}

export type DnsRecordColumnWithPossibleError = DnsRecordColumnHeader.PRIORITY | DnsRecordColumnHeader.VALUE;

// Amount of time before expiry where we show a warning on the UI
// Default is 30 days
export const EXPIRES_SOON_BUFFER_IN_MS = 1_000 * 60 * 60 * 24 * 30;
// Amount of time before we confirm verification of domain
// Default is 1 hour
export const VERIFICATION_DELAY_IN_MS = 1_000 * 60 * 60 * 1;

// Wait to confirm VERIFIED status until it's a delay since the record was created
// given uncertainty in DNS record propagation times
export const getUserFacingVerificationStatus = (
  statusFromDB: CustomDomainStatus,
  createdAt: Date,
  dnsRecords: DnsRecord[],
  skiffManaged: boolean
): UserFacingCustomDomainStatus => {
  const hasVerificationDelayElapsed = Date.now() > createdAt.getTime() + VERIFICATION_DELAY_IN_MS;
  if (!hasVerificationDelayElapsed) {
    // always return 'PENDING' within the verification delay time window for 1CCD's;
    // minimize chance of displaying an error state that will self-resolve
    if (skiffManaged) {
      return UserFacingCustomDomainStatus.PENDING;
    }
    // for external domains, only show error within this window if there's a mismatch,
    // since such errors will not self-resolve
    return dnsRecords.some((record) => record.error?.errorType === CUSTOM_DOMAIN_RECORD_ERRORS.RECORD_MISMATCH)
      ? UserFacingCustomDomainStatus.DNS_RECORD_ERROR
      : UserFacingCustomDomainStatus.PENDING;
  }
  // the delay has elapsed and domain is most likely either in 'VERIFIED' or some error state ('PENDING' without errors only possible here if job was delayed somehow)
  if (statusFromDB !== CustomDomainStatus.VERIFIED) {
    // records in pending states that have errors require user action, so a more relevant status is used
    return statusFromDB === CustomDomainStatus.FAILED_REVERIFICATION || dnsRecords.some((record) => !!record.error)
      ? UserFacingCustomDomainStatus.DNS_RECORD_ERROR
      : UserFacingCustomDomainStatus.PENDING;
  }
  return UserFacingCustomDomainStatus.VERIFIED;
};

export const getValueAndPriority = (data: string, type: DnsRecordType) => {
  if (type === DnsRecordType.Mx) {
    const [priority, value] = data.split(' ');
    return { value, priority };
  }
  return { value: data, priority: 'N/A' };
};

// We disregard errors for verified domains, since they may be whitelisted, and a verified status is the ultimate source of truth
export const getErrorStatusForDnsRecord = (domainStatus: UserFacingCustomDomainStatus, dnsRecord: DnsRecord) =>
  domainStatus !== UserFacingCustomDomainStatus.VERIFIED && !!dnsRecord.error;

export const getErrorDataForDnsRecordValue = (
  dnsRecord: DnsRecord,
  valueType: DnsRecordColumnWithPossibleError,
  domainStatus: UserFacingCustomDomainStatus
) => {
  const hasError = getErrorStatusForDnsRecord(domainStatus, dnsRecord);
  if (!hasError) return;
  const { priority, value } = getValueAndPriority(dnsRecord.data, dnsRecord.type);
  // record wasn't found, all values should be highlighted
  if (dnsRecord.error?.errorType === CUSTOM_DOMAIN_RECORD_ERRORS.DNS_RETRIEVAL_ERROR) {
    return valueType === DnsRecordColumnHeader.VALUE
      ? `No '${dnsRecord.type}' record found with this value`
      : undefined;
  }
  // there must me a record mismatch, which can happen only on priority and data fields;
  // because if there is a mismatch on the name field, we would not have found the record
  // and the above error condition would have triggered
  if (
    valueType === DnsRecordColumnHeader.PRIORITY &&
    dnsRecord.type === DnsRecordType.Mx && //priority can only be wrong for MX record
    dnsRecord.error?.errorData?.retrievedRecord?.priority &&
    dnsRecord.error.errorData.retrievedRecord.priority !== priority
  ) {
    return dnsRecord.error.errorData.retrievedRecord.priority;
  }
  if (
    valueType === DnsRecordColumnHeader.VALUE &&
    dnsRecord.error?.errorData?.retrievedRecord?.data &&
    dnsRecord.error.errorData.retrievedRecord.data !== value
  ) {
    return dnsRecord.error?.errorData?.retrievedRecord?.data;
  }
};
