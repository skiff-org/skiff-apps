import { useState } from 'react';
import { useAddExternalEmailMutation } from 'skiff-front-graphql';

/**
 * Returns
 * - a function that runs the addEmail mutation and returns its status
 * - the loading state for adding a backup email
 * - the error message that results from adding a backup email
 * - a setter for the error message
 */
export const useAddBackupEmail = () => {
  const [error, setError] = useState('');
  const [addEmail, { loading }] = useAddExternalEmailMutation({ onError: (e) => setError(e.message) });

  const runAddEmail = async (email: string) => {
    const { data } = await addEmail({ variables: { request: { newEmail: email } } });
    return data?.addEmail.status;
  };

  return { error, loading, runAddEmail, setError };
};
