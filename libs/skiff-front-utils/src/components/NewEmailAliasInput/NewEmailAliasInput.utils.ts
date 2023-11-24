import { postSubmitAliasValidation, preSubmitAliasValidation } from '../../utils';

// Validates email alias syntax
export const checkValidEmailAlias = (
  emailAlias: string,
  setPreSubmitError: (error?: string) => void,
  setPostSubmitError: (error?: string) => void
) => {
  if (!emailAlias) {
    setPreSubmitError(undefined);
    setPostSubmitError(undefined);
    return false;
  }

  try {
    preSubmitAliasValidation(emailAlias);
    try {
      postSubmitAliasValidation(emailAlias);
    } catch (error: unknown) {
      setPreSubmitError(undefined);
      setPostSubmitError((error as Error).message);
      return false;
    }

    // Clear all errors
    setPreSubmitError(undefined);
    setPostSubmitError('');
    return true;
  } catch (error: unknown) {
    setPreSubmitError((error as Error).message);
    setPostSubmitError(undefined);
    return false;
  }
};
