import { MailFilterBody } from '../src/generated/protos/com/skiff/skemail/filters/filters';

const nestingFilterCriteria = ['AND', 'OR', 'NOT'];

const clientsideFilterCriteria = ['SUBJECT', 'BODY'];

export function isClientside(mailFilter: MailFilterBody): boolean {
  if (nestingFilterCriteria.includes(mailFilter.filterType)) {
    return mailFilter.subFilter.some((f) => isClientside(f));
  } else {
    return clientsideFilterCriteria.includes(mailFilter.filterType);
  }
}
