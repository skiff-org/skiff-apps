import { Button, InputField, Typography } from 'nightwatch-ui';
import React, { useState } from 'react';
import { getEnvironment } from 'skiff-front-utils';
import { isMobileApp, sendRNWebviewMsg } from 'skiff-front-utils';
import styled from 'styled-components';

import { saveCurrentUserData } from '../apollo/currentUser';
import MobileHead from '../components/shared/MobileHead';
import { loginServerSRP } from '../utils/loginUtils';
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

const LoginInput = styled(InputField)`
  margin-bottom: 10px;
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
    const { user, error: loginError } = await loginServerSRP(username, password);
    if (!user || loginError) {
      setError(loginError ?? 'User not found.');
      setLoading(false);
      return null;
    }

    if (isMobileApp()) {
      sendRNWebviewMsg('userLoggedIn', { userID: user.userID });
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
            <Typography align='center' level={0} style={{ marginBottom: 20, fontSize: 24 }} type='heading'>
              Log in to Skemail
            </Typography>
            <LoginInput
              dataTest='login-email-input'
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={submitOnEnter}
              placeholder='Username'
              size='large'
              value={username}
            />
            <LoginInput
              dataTest='login-password-input'
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={submitOnEnter}
              password
              placeholder='Password'
              size='large'
              value={password}
            />
            <Button align='center' dataTest='login-submit' fullWidth onClick={() => void login()}>
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
          <Typography align='center' level={0} type='heading'>
            Loading...
          </Typography>
        )}
      </LoginContainer>
    </StyledPage>
  );
}

export default Index;
