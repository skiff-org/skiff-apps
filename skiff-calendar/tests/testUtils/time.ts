import { dayjs } from '../../src/utils/dateTimeUtils';
export const formatDate = (dateString: string) => dayjs(dateString).valueOf();
