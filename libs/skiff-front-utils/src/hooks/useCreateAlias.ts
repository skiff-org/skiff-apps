import { ErrorPolicy } from '@apollo/client';
import {
  useCreateCustomDomainAliasMutation,
  useCreateEmailAliasMutation,
  useUserLabelsLazyQuery
} from 'skiff-front-graphql';

import { useCurrentUserData } from '../apollo';
import { updateEmailAliases } from '../utils';

const useCreateAlias = () => {
  // Graphql
  const [createEmailAlias, { loading: isCreateEmailAliasLoading }] = useCreateEmailAliasMutation();
  const [createCustomDomainAlias, { loading: isCreateCustomDomainAliasLoading }] = useCreateCustomDomainAliasMutation();
  const isLoading = isCreateCustomDomainAliasLoading || isCreateEmailAliasLoading;
  const [fetchUserLabels] = useUserLabelsLazyQuery();

  // If no user ID exists then the user is still being created and this is likely called during sign up
  const userData = useCurrentUserData();
  const userID = userData?.userID;

  const addCustomDomainAlias = async (
    newAlias: string,
    customDomain: string,
    emailAliasUserID?: string,
    setMemberEmailAliases?: (updatedEmailAliases: string[]) => void
  ) => {
    if (!userID) return;
    await createCustomDomainAlias({
      variables: {
        request: {
          emailAlias: newAlias,
          customDomain,
          userID: emailAliasUserID
        }
      },
      update: (cache, response) => {
        const updatedEmailAliases = response.data?.createCustomDomainAlias?.emailAliases;
        if (response.errors || !updatedEmailAliases) return;
        updateEmailAliases(cache, userID, updatedEmailAliases);
        setMemberEmailAliases?.(updatedEmailAliases);
        // refetch user labels to update aliases labels in the sidebar
        void fetchUserLabels();
      }
    });
  };

  const addEmailAlias = async (newAlias: string, errorPolicy?: ErrorPolicy) => {
    const res = await createEmailAlias({
      variables: {
        request: {
          emailAlias: newAlias
        }
      },
      update: !!userID
        ? (cache, response) => {
            const updatedEmailAliases = response.data?.createEmailAlias?.emailAliases;
            if (!response.errors && updatedEmailAliases) {
              updateEmailAliases(cache, userID, updatedEmailAliases);
              // refetch user labels to update aliases labels in the sidebar
              void fetchUserLabels();
            }
          }
        : undefined,
      errorPolicy
    });

    return res;
  };

  return {
    addCustomDomainAlias,
    addEmailAlias,
    isLoading
  };
};

export default useCreateAlias;
