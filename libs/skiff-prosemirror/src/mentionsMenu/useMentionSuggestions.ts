import { useEffect, useMemo, useState } from 'react';

import { CommandsAfterNoMatch, MentionSuggestions, MentionSuggestionsWithActions, UserMentionType } from './utils';

/**
 * This will return 4 suggestions
 * if possible 2 documents 2 people
 * if there is not enough people it will be filled with invites
 * and will keep it on 4 suggestions if possible
 * for example:
 *
 * 1 document
 * 3 people
 *
 * 0 people
 * 1 invite
 * 3 documents
 *
 * 0 people
 * 2 invites
 * 2 documents
 * */
const sliceSuggestions = (suggestions: MentionSuggestions): MentionSuggestions => {
  let documentsSuggestions = suggestions.documents;
  let usersSuggestions = suggestions.users.sort((mentionRef) => (mentionRef.type === UserMentionType ? -1 : 1));
  const { documents, users } = suggestions;

  if (suggestions.documents.length < 2) {
    documentsSuggestions = documents;
    usersSuggestions = users.slice(0, 4 - documentsSuggestions.length);
  } else if (suggestions.users.length < 4) {
    usersSuggestions = users;
    documentsSuggestions = documents.slice(0, 4 - usersSuggestions.length);
  } else {
    documentsSuggestions = documents.slice(0, 2);
    usersSuggestions = users.slice(0, 2);
  }

  return {
    documents: documentsSuggestions,
    users: usersSuggestions
  };
};

const useMentionSuggestions = (
  filter: string,
  getMentionSuggestions: (filter: string) => Promise<MentionSuggestions>
) => {
  const [suggestions, setSuggestions] = useState<MentionSuggestionsWithActions>({
    users: [],
    documents: [],
    actions: []
  });

  useEffect(() => {
    const getSuggestions = async () => {
      const filteredSuggestions = await getMentionSuggestions(filter);
      const slicedSuggestions = sliceSuggestions(filteredSuggestions);
      setSuggestions({
        users: slicedSuggestions.users,
        documents: slicedSuggestions.documents,
        actions: !filteredSuggestions.documents.length && !filteredSuggestions.users.length ? CommandsAfterNoMatch : []
      });
    };
    void getSuggestions();
  }, [filter]);

  const allSuggestions = useMemo(
    () => [...suggestions.users, ...suggestions.documents, ...suggestions.actions],
    [suggestions]
  );

  return { suggestions, allSuggestions };
};

export default useMentionSuggestions;
