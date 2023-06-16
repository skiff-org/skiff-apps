import {
  useDeleteCustomDomainAliasMutation,
  useUpdateEmailAliasActiveStateMutation,
  useUserLabelsLazyQuery
} from 'skiff-front-graphql';
import { RequestStatus } from 'skiff-graphql';
import { isSkiffAddress } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../apollo';
import { updateEmailAliases } from '../utils/cacheUtils';

import useCurrentUserEmailAliases from './useCurrentUserEmailAliases';
import useDefaultEmailAlias from './useDefaultEmailAlias';
import useToast from './useToast';

/** TODO [PROD-2588]: Duplicate in skemail-web that includes resolveAndSetENSDisplayName
 * Once we dedupe userUtils, we should dedupe with that hook
 */
const useDeleteEmailAlias = (requestHcaptchaToken: () => Promise<string>) => {
  /** Custom hooks */
  const { enqueueToast } = useToast();
  const { userID } = useRequiredCurrentUserData();
  const emailAliases = useCurrentUserEmailAliases();
  const [defaultEmailAlias] = useDefaultEmailAlias();

  /** Graphql */
  const [deleteCustomDomainAlias] = useDeleteCustomDomainAliasMutation();
  const [updateEmailAliasActiveState] = useUpdateEmailAliasActiveStateMutation();
  const [fetchUserLabels] = useUserLabelsLazyQuery();

  const deleteEmailAlias = async (
    selectedEmailAlias: string,
    emailAliasUserID?: string,
    setMemberEmailAliases?: (updatedEmailAliases: string[]) => void
  ) => {
    const captchaToken = await requestHcaptchaToken();
    const errorToast = {
      title: 'Could not delete alias',
      body: 'An error occurred while deleting alias.'
    };
    const defaultAliasErrorToast = {
      title: 'Could not delete alias',
      body: 'Cannot delete default alias'
    };
    const successToast = {
      title: 'Alias deleted',
      body: `${selectedEmailAlias} is no longer associated with your account.`
    };
    if (selectedEmailAlias === defaultEmailAlias) {
      enqueueToast(defaultAliasErrorToast);
      return;
    }

    // Reserved custom domain aliases (e.g. 'ethereum.email' ) are also
    // considered to be Skiff addresses when determining deletion policy
    const isCustomDomainAlias = !isSkiffAddress(selectedEmailAlias);

    try {
      // If deleting a custom doman alias, then actually delete the alias.
      // Otherwise, only change the status of the `isActive` status of the alias.
      if (isCustomDomainAlias) {
        await deleteCustomDomainAlias({
          variables: {
            request: {
              captchaToken,
              emailAlias: selectedEmailAlias,
              userID: emailAliasUserID
            }
          },
          update: (cache, response) => {
            if (response.errors) {
              enqueueToast(errorToast);
              return;
            }
            const updatedEmailAliases = emailAliases.filter((alias) => alias !== selectedEmailAlias);
            updateEmailAliases(cache, userID, updatedEmailAliases);
            setMemberEmailAliases?.(updatedEmailAliases);
            enqueueToast(successToast);
            // refetch user labels to update aliases labels in the sidebar
            void fetchUserLabels();
          }
        });
      } else {
        await updateEmailAliasActiveState({
          variables: {
            request: {
              captchaToken,
              emailAlias: selectedEmailAlias,
              isActive: false
            }
          },
          update: (cache, response) => {
            if (response.errors || response.data?.updateEmailAliasActiveState?.status !== RequestStatus.Success) {
              enqueueToast(errorToast);
              return;
            }
            const updatedEmailAliases = emailAliases.filter((alias) => alias !== selectedEmailAlias);
            updateEmailAliases(cache, userID, updatedEmailAliases);
            enqueueToast(successToast);
            // refetch user labels to update aliases labels in the sidebar
            void fetchUserLabels();
          }
        });
      }
    } catch (_e: unknown) {
      enqueueToast(errorToast);
    }
  };

  return deleteEmailAlias;
};

export default useDeleteEmailAlias;
