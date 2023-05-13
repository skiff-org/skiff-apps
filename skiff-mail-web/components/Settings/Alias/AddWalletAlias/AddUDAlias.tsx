import type { DomainResolver } from '@uauth/common';
import UAuth from '@uauth/js';
import { Button, Icon, Type } from 'nightwatch-ui';
import React, { useState } from 'react';
import { useCreateUdAliasMutation } from 'skiff-front-graphql';
import { useToast } from 'skiff-front-utils';
import styled from 'styled-components';

const WalletButtonContainer = styled.div`
  width: 48%; // with flex wrap creates 2 cols
`;

class EmptyDomainResolver implements DomainResolver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  records(_domain: string, _keys: string[]): Promise<Record<string, string>> {
    return Promise.resolve({});
  }
}

const AddUDAlias: React.FC = () => {
  const [isAddingAlias, setIsAddingAlias] = useState(false);
  const [createUdAlias] = useCreateUdAliasMutation();
  const { enqueueToast } = useToast();

  const uauth = new UAuth({
    clientID: '241f300e-b95f-4a1c-9fa1-e2a88f7ee5b5',
    redirectUri: window.location.origin,
    resolution: new EmptyDomainResolver()
  });

  const onError = (error: any) => {
    console.error('Create UD alias', error);
    enqueueToast({
      title: 'Failed to connect',
      body: 'Could not connect Unstoppable.'
    });
  };

  const onClick = async () => {
    setIsAddingAlias(true);
    try {
      const authorization = await uauth.loginWithPopup();
      const udToken = authorization.accessToken;
      const { errors } = await createUdAlias({
        variables: {
          request: {
            udToken
          }
        }
      });
      if (errors?.length) {
        onError(errors[0]);
      }
    } catch (error) {
      onError(error);
    }
    setIsAddingAlias(false);
  };

  return (
    <WalletButtonContainer>
      <Button
        fullWidth
        iconColor='source'
        key='add-unstoppable'
        loading={isAddingAlias}
        onClick={onClick}
        startIcon={Icon.Unstoppable}
        type={Type.SECONDARY}
      >
        {isAddingAlias ? `Check wallet...` : 'Unstoppable Domains'}
      </Button>
    </WalletButtonContainer>
  );
};

export default AddUDAlias;
