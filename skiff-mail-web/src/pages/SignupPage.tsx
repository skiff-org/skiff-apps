import { useEffect } from 'react';
import { getEditorBasePath } from 'skiff-front-utils';

const SignupPage = () => {
  useEffect(() => {
    window.location.replace(`${getEditorBasePath()}/signup-mail`);
  }, []);
  return null;
};

export default SignupPage;
