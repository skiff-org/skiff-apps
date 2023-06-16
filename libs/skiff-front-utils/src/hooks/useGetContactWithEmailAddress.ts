import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { useGetContactsQuery } from 'skiff-front-graphql';
import { Contact } from 'skiff-graphql';
import { getContactDataFromCache } from '../utils';

interface ContactWithEmailAddressProps {
  emailAddress: string | undefined;
  client: ApolloClient<NormalizedCacheObject>;
}

const useGetContactWithEmailAddress = ({ emailAddress, client }: ContactWithEmailAddressProps): Contact | undefined => {
  const cachedDocumentInfo = emailAddress ? getContactDataFromCache(emailAddress, client) : undefined;

  const { data: contactData } = useGetContactsQuery({
    variables: {
      request: {
        emailAddresses: [emailAddress || '']
      }
    },
    skip: !emailAddress || !!cachedDocumentInfo
  });

  const contact = contactData?.contacts[0];
  if (!contact) return undefined;

  return contact ?? undefined;
};

export default useGetContactWithEmailAddress;
