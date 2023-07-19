import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  ButtonGroup,
  ButtonGroupItem,
  Divider,
  Icon,
  IconText,
  InputField,
  Layout,
  Size,
  ThemeMode,
  Typography,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import { FC, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetOrganizationQuery, useValidateMailAliasLazyQuery } from 'skiff-front-graphql';
import { getPaywallErrorCode } from 'skiff-graphql';
import { insertIf, PaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';
import isEmail from 'validator/lib/isEmail';

import { useRequiredCurrentUserData } from '../../../apollo';
import { useAvailableCustomDomains, useToast } from '../../../hooks';
import { formatUsernameAndCheckExists, generateRandomPassword, MAIL_DOMAIN, provisionNewUser } from '../../../utils';
import InputFieldEndAction from '../../InputFieldEndAction';
import { NewEmailAliasInput } from '../../NewEmailAliasInput';

const AccountContainer = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  gap: 8px;

  width: 440px;
  height: 100;

  background: var(--bg-overlay-tertiary);
  box-shadow: var(--inset-empty);
  border-radius: 8px;
`;

const Footer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
`;

const EmailAliasContainer = styled.div`
  margin-top: 4px;
  width: 100%;
`;

const CopyCredentialsButton = styled.div`
  width: fit-content;
`;

const InputFieldDivider = styled(Divider)`
  margin: 2px 0 !important;
`;

// the score required for a password to be strong enough
const PASSING_SCORE = 2;
interface ProvisionAccountProps {
  client: ApolloClient<NormalizedCacheObject>;
  showConfirmProvision: boolean;
  onCancel: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
  setPaywallErrorCode: (paywallErrorCode: PaywallErrorCode) => void;
}

const ProvisionAccount: FC<ProvisionAccountProps> = ({
  client,
  onCancel,
  onConfirm,
  onBack,
  onClose,
  showConfirmProvision,
  setPaywallErrorCode
}: ProvisionAccountProps) => {
  const [alias, setAlias] = useState('');
  const [aliasErrorMsg, setAliasErrorMsg] = useState('');
  const [didSubmit, setDidSubmit] = useState(false);
  const [customDomain, setCustomDomain] = useState<string>();
  const [password, setPassword] = useState(generateRandomPassword());
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryEmailErrorMsg, setDeliveryEmailErrorMsg] = useState('');
  const [checkAliasExists] = useValidateMailAliasLazyQuery();

  const availableCustomDomains = useAvailableCustomDomains();
  const newEmailAddress = `${alias}@${customDomain ?? MAIL_DOMAIN}`;
  const { enqueueToast } = useToast();
  const { rootOrgID } = useRequiredCurrentUserData();
  const { data } = useGetOrganizationQuery({
    variables: {
      id: rootOrgID
    }
  });
  const everyoneTeamRootDoc = data?.organization.everyoneTeam.rootDocument;

  const validateInputs = async () => {
    const { default: zxcvbn } = await import(/* webpackChunkName: "zxcvbn" */ 'zxcvbn');

    let inputsAreValid = true;
    if (zxcvbn(password).score < PASSING_SCORE) {
      inputsAreValid = false;
      setPasswordErrorMsg('Weak password');
    }
    if (deliveryEmail && !isEmail(deliveryEmail)) {
      inputsAreValid = false;
      setDeliveryEmailErrorMsg('Valid email required');
    }
    if (!alias) {
      inputsAreValid = false;
      setAliasErrorMsg('Please enter an alias');
    }

    if (!inputsAreValid) {
      return false;
    }

    if (!customDomain) {
      // if @skiff.com, check validity
      const checkExistsResult = await checkAliasExists({
        variables: {
          request: {
            alias
          }
        }
      });
      if (!checkExistsResult.data?.aliasValid) {
        console.error('Invalid alias for provision');
        setAliasErrorMsg('Email is invalid, too short, or has already been taken.');
        return null;
      }
    }

    const { formattedUsername } = await formatUsernameAndCheckExists(client, newEmailAddress);
    if (!!formattedUsername) {
      setAliasErrorMsg('Email is invalid, too short, or has already been taken');
      return null;
    }
    return true;
  };

  const onClickConfirm = async () => {
    const inputsValid = await validateInputs();
    if (!inputsValid) {
      return;
    }
    // If delivery email is entered and we need to confirm, go to confirm screen;
    // otherwise, submit directly
    if (deliveryEmail && !showConfirmProvision) {
      onConfirm();
    } else {
      try {
        const captchaToken = 'invalid';
        await provisionNewUser(
          client,
          captchaToken,
          newEmailAddress,
          password,
          rootOrgID,
          everyoneTeamRootDoc,
          deliveryEmail
        );
      } catch (e) {
        const paywallErrorCode = getPaywallErrorCode([e] as any[]);
        if (paywallErrorCode) {
          setPaywallErrorCode(paywallErrorCode);
        } else {
          setAliasErrorMsg('Failed to provision user. Please contact support@skiff.org.');
          // leave modal open
          return;
        }
      }
      onClose();
    }
  };

  const onCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    void navigator.clipboard.writeText(`${newEmailAddress}\n${password}`);
    enqueueToast({
      title: 'Account credentials copied',
      body: 'The new login credentials are now in your clipboard.'
    });
  };

  const copyCredentialsButton = (
    <CopyCredentialsButton>
      <IconText
        color='disabled'
        endIcon={Icon.Copy}
        iconColor='secondary'
        label='Copy credentials'
        onClick={onCopy}
        weight={TypographyWeight.REGULAR}
      />
    </CopyCredentialsButton>
  );

  const footerButtonGroupItems = [
    {
      label: showConfirmProvision ? 'Send invite' : 'Confirm',
      onClick: () => void onClickConfirm(),
      forceTheme: isMobile ? ThemeMode.DARK : undefined
    },
    {
      label: 'Back',
      onClick: showConfirmProvision ? onBack : onCancel,
      forceTheme: isMobile ? ThemeMode.DARK : undefined
    },
    ...insertIf(!showConfirmProvision && isMobile, {
      label: 'Copy credentials',
      onClick: onCopy,
      forceTheme: isMobile ? ThemeMode.DARK : undefined
    })
  ];

  return (
    <>
      {showConfirmProvision && (
        <AccountContainer>
          <Typography mono uppercase forceTheme={isMobile ? ThemeMode.DARK : undefined}>
            {deliveryEmail}
          </Typography>
          <IconText
            color='secondary'
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            label={newEmailAddress}
            size={Size.SMALL}
            startIcon={Icon.User}
            weight={TypographyWeight.REGULAR}
          />
          <IconText
            color='secondary'
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            label={password}
            size={Size.SMALL}
            startIcon={Icon.Key}
            weight={TypographyWeight.REGULAR}
          />
        </AccountContainer>
      )}
      {!showConfirmProvision && (
        <>
          <EmailAliasContainer>
            <NewEmailAliasInput
              customDomains={availableCustomDomains}
              didSubmit={didSubmit}
              newAlias={alias}
              postSubmitError={aliasErrorMsg}
              preSubmitError={aliasErrorMsg}
              selectedCustomDomain={customDomain}
              setAlias={setAlias}
              setCustomDomain={setCustomDomain}
              setDidSubmit={setDidSubmit}
              setPostSubmitError={setAliasErrorMsg}
              setPreSubmitError={setAliasErrorMsg}
              username={alias}
              forceTheme={ThemeMode.DARK}
            />
            {isMobile && <div style={{ marginBottom: '16px' }} />}
          </EmailAliasContainer>
          <InputField
            endAdornment={
              <InputFieldEndAction
                icon={Icon.Reload}
                forceTheme={isMobile ? ThemeMode.DARK : undefined}
                onClick={() => {
                  setPassword(generateRandomPassword());
                }}
              />
            }
            errorMsg={passwordErrorMsg}
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPasswordErrorMsg('');
              setPassword(e.target.value);
            }}
            placeholder='Temporary password'
            value={password}
          />
          {!isMobile && <InputFieldDivider />}
          <InputField
            errorMsg={deliveryEmailErrorMsg}
            forceTheme={isMobile ? ThemeMode.DARK : undefined}
            helperText={isMobile ? undefined : 'Login credentials will be sent to this email'}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setDeliveryEmailErrorMsg('');
              setDeliveryEmail(e.target.value);
            }}
            placeholder='Delivery email (optional)'
            value={deliveryEmail}
          />
        </>
      )}
      <Footer>
        {!showConfirmProvision && !isMobile && <>{copyCredentialsButton}</>}
        <ButtonGroup fullWidth={isMobile} layout={isMobile ? Layout.STACKED : Layout.INLINE}>
          {footerButtonGroupItems.map((item, index) => {
            return (
              <ButtonGroupItem forceTheme={item.forceTheme} key={index} label={item.label} onClick={item.onClick} />
            );
          })}
        </ButtonGroup>
      </Footer>
    </>
  );
};

export default ProvisionAccount;
