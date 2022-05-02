import { Button, InputField, Typography } from '@skiff-org/skiff-ui';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

import { saveCurrentUserData } from '../apollo/currentUser';
import MobileHead from '../components/shared/MobileHead';
import { getEditorBasePath } from '../utils/linkToEditorUtils';
import { loginServerSRP } from '../utils/loginUtils';
import { isMobileApp, sendRNWebviewMsg } from '../utils/mobileApp';

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
  const router = useRouter();

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
    await router.push('/inbox');
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void login();
  };

  if (window.location.hostname !== 'localhost') {
    // redirects from https://app.skiff.x/mail to https://app.skiff.x/
    window.location.replace(getEditorBasePath());
  }

  return (
    <StyledPage>
      <MobileHead />
      <LoginContainer>
        {!loading && (
          <>
            <Typography align='center' level={0} style={{ marginBottom: 20, fontSize: 24 }} type='heading'>
              Log in to Skemail
            </Typography>
            <LoginInput
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={submitOnEnter}
              placeholder='Username'
              value={username}
            />
            <LoginInput
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={submitOnEnter}
              password
              placeholder='Password'
              value={password}
            />
            <Button align='center' fullWidth onClick={login}>
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
