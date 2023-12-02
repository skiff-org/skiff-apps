import dayjs from 'dayjs';
import { Chip, FilledVariant, Icon, Icons, Size } from 'nightwatch-ui';
import {
  doesNormalizedTextMatch,
  getMatchingFieldsFromMatchInfo,
  getMatchingTermsFromMatchInfo,
  getSpaceDelimitedTerms
} from 'skiff-front-search';
import { SystemLabels } from 'skiff-graphql';
import styled from 'styled-components';

import { useDate } from '../../../hooks/useDate';
import { MailboxEmailInfo } from '../../../models/email';
import { getScheduledSendAtDateForThread } from '../../../utils/mailboxUtils';
import { MatchInfo } from '../../../utils/search/searchTypes';
import { FROM_RELATED_FIELDS } from '../../../utils/search/useSkemailSearch';

import { getSenders } from './utils';

const SearchText = styled.span`
  color: var(--icon-link);
`;

export const renderTextWithQueryMatch = (text: string, matchInfo?: MatchInfo) => {
  if (!matchInfo) {
    return text;
  }

  const matchingTerms = getMatchingTermsFromMatchInfo(matchInfo);

  const spaceDelimitedTerms = getSpaceDelimitedTerms(text);
  // process each space-delimited term in the query to match
  // with minisearch normalization; if any space-delimited term includes
  // a matching token within it, highlight the whole term
  const highlightedTerms = new Set(spaceDelimitedTerms.filter((term) => doesNormalizedTextMatch(term, matchingTerms)));

  return (
    <>
      {spaceDelimitedTerms.map((term, index) => {
        const reformattedTerm = index === spaceDelimitedTerms.length - 1 ? term : term + ' ';
        return highlightedTerms.has(term) ? (
          <SearchText key={`${term}-${index}`}>{reformattedTerm}</SearchText>
        ) : (
          <span key={`${term}-${index}`}>{reformattedTerm}</span>
        );
      })}
    </>
  );
};

export const renderSendersWithQueryMatch = (displayNames: string[], matchInfo?: MatchInfo) => {
  const senderText = getSenders(displayNames);
  if (!matchInfo) return senderText;
  // if we matched on an address or display name, highlight the entire display name to convey that the sender was a match
  return getMatchingFieldsFromMatchInfo(matchInfo).some((field) => FROM_RELATED_FIELDS.includes(field)) ? (
    <SearchText>{senderText}</SearchText>
  ) : (
    senderText
  );
};

export const useCellDate = (date: Date) => {
  const { getMonthAndDay, getTime } = useDate();

  return dayjs(date).isToday() ? getTime(date) : getMonthAndDay(date);
};

const ScheduledSendLinkContainer = styled.div`
  order: 1;
`;

export const renderScheduledSendLink = (emails: MailboxEmailInfo[], systemLabels: string[], isCompact?: boolean) => {
  const sendAtDate = getScheduledSendAtDateForThread(emails);

  const showChip = systemLabels.includes(SystemLabels.ScheduleSend) && sendAtDate;
  if (!showChip) return null;
  return (
    <ScheduledSendLinkContainer>
      <Chip
        color='secondary'
        icon={<Icons color='orange' icon={Icon.Clock} />}
        label={dayjs(sendAtDate).format('ddd, MMM D [at] h:mm A')}
        size={isCompact ? Size.X_SMALL : Size.SMALL}
        variant={FilledVariant.UNFILLED}
      />
    </ScheduledSendLinkContainer>
  );
};
