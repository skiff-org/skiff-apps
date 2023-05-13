import {
  Alignment,
  Button,
  InputField,
  InputType,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useState } from 'react';
import { getEnvironment, saveCurrentUserData, sendUserDataToMobileApp, isMobileApp } from 'skiff-front-utils';
import styled from 'styled-components';

import MobileHead from '../components/shared/MobileHead';
import { useNavigate } from '../utils/navigation';

const StyledPage = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
`;

const LoginContainer = styled.div`
  width: 400px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputFieldContainer = styled.div`
  margin-bottom: 10px;
`;

const LoginTextContainer = styled.div`
  margin-bottom: 20px;
`;

export function Index() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { navigateToInbox } = useNavigate();

  const login = async () => {
    setError('');
    setLoading(true);
    const { loginServerSRP } = await import('../utils/loginUtils');
    const { user, error: loginError } = await loginServerSRP(username, password);

    if (!user || loginError) {
      setError(loginError ?? 'User not found.');
      setLoading(false);
      return null;
    }

    if (isMobileApp()) {
      sendUserDataToMobileApp(user);
    }

    saveCurrentUserData(user);
    await navigateToInbox();
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void login();
  };

  const env = getEnvironment(new URL(window.location.origin));

  return (
    <StyledPage>
      <MobileHead />
      <LoginContainer>
        {!loading && (env === 'development' || env === 'local' || env === 'review_app' || env === 'vercel') && (
          <>
            <LoginTextContainer>
              <Typography align={Alignment.CENTER} size={TypographySize.H3} weight={TypographyWeight.BOLD}>
                Log in to Skemail
              </Typography>
            </LoginTextContainer>
            <InputFieldContainer>
              <InputField
                dataTest='login-email-input'
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={submitOnEnter}
                placeholder='Username'
                size={Size.LARGE}
                value={username}
              />
            </InputFieldContainer>
            <InputFieldContainer>
              <InputField
                dataTest='login-password-input'
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={submitOnEnter}
                placeholder='Password'
                size={Size.LARGE}
                type={InputType.PASSWORD}
                value={password}
              />
            </InputFieldContainer>
            <Button dataTest='login-submit' fullWidth onClick={() => void login()}>
              Login
            </Button>
            {error && (
              <Typography color='destructive' wrap>
                {error}
              </Typography>
            )}
          </>
        )}
        {loading && (
          <Typography align={Alignment.CENTER} size={TypographySize.H3} weight={TypographyWeight.BOLD}>
            Loading...
          </Typography>
        )}
      </LoginContainer>
    </StyledPage>
  );
}

export default Index;
