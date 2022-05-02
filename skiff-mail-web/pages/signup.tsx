import { useEffect } from 'react';

import { getEditorBasePath } from '../utils/linkToEditorUtils';

const SignupPage = () => {
  useEffect(() => {
    window.location.replace(`${getEditorBasePath()}/signup-mail`);
  }, []);
  return null;
};

export default SignupPage;
