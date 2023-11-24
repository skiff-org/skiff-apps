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
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { FC, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetOrganizationQuery, useSubscriptionPlan, useValidateMailAliasLazyQuery } from 'skiff-front-graphql';
import { getPaywallErrorCode } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';
import isEmail from 'validator/lib/isEmail';

import { useRequiredCurrentUserData } from '../../../apollo';
import { useAvailableCustomDomains, useToast } from '../../../hooks';
import { MAIL_DOMAIN, formatUsernameAndCheckExists, generateRandomPassword, provisionNewUser } from '../../../utils';
import { getPaywallDescription, getPaywallTitle } from '../../../utils/paywallUtils';
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

const HeaderInput = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2px;
  box-sizing: border-box;
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
}

const ProvisionAccount: FC<ProvisionAccountProps> = ({
  client,
  onCancel,
  onConfirm,
  onBack,
  onClose,
  showConfirmProvision
}: ProvisionAccountProps) => {
  const [alias, setAlias] = useState('');
  const [aliasErrorMsg, setAliasErrorMsg] = useState<string | undefined>(undefined);
  const [customDomain, setCustomDomain] = useState<string>();
  const [password, setPassword] = useState(generateRandomPassword());
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryEmailErrorMsg, setDeliveryEmailErrorMsg] = useState('');
  const [checkAliasExists] = useValidateMailAliasLazyQuery();
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();

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
    setLoadingConfirm(true);
    const inputsValid = await validateInputs();
    if (!inputsValid) {
      setLoadingConfirm(false);
      return;
    }
    // If delivery email is entered and we need to confirm, go to confirm screen;
    // otherwise, submit directly
    if (deliveryEmail && !showConfirmProvision) {
      onConfirm();
      setLoadingConfirm(false);
    } else {
      try {
        const captchaToken = 'invalid';
        const res = await provisionNewUser(
          client,
          captchaToken,
          newEmailAddress,
          password,
          rootOrgID,
          everyoneTeamRootDoc,
          deliveryEmail
        );
        setLoadingConfirm(false);

        const paywallErrorCode = getPaywallErrorCode(res.errors ?? []);
        if (paywallErrorCode) {
          enqueueToast({
            title: getPaywallTitle(paywallErrorCode),
            body: getPaywallDescription(paywallErrorCode, activeSubscription)
          });
        } else {
          enqueueToast({
            title: 'Account provisioned',
            body: `The new account has been provisioned.${
              !!deliveryEmail ? ` Login credentials have been sent to ${deliveryEmail}.` : ''
            }`
          });
          onClose();
        }
      } catch (e) {
        console.error('Failed to provision user');
        console.error(e);
        setLoadingConfirm(false);
        setAliasErrorMsg('Failed to provision user. Please contact support@skiff.org.');
        // leave modal open
        return;
      }
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
        color='secondary'
        endIcon={Icon.Copy}
        label='Copy credentials'
        onClick={onCopy}
        weight={TypographyWeight.REGULAR}
      />
    </CopyCredentialsButton>
  );

  const footerButtonGroupItems = [
    {
      label: showConfirmProvision ? 'Send invite' : 'Create',
      onClick: () => void onClickConfirm(),
      loading: loadingConfirm
    },
    {
      label: 'Back',
      onClick: showConfirmProvision ? onBack : onCancel,
      loading: false
    },
    ...insertIf(!showConfirmProvision && isMobile, {
      label: 'Copy credentials',
      onClick: onCopy,
      loading: false
    })
  ];

  return (
    <>
      {showConfirmProvision && (
        <>
          <AccountContainer>
            <Typography forceTheme={isMobile ? ThemeMode.DARK : undefined}>{deliveryEmail}</Typography>
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
          {aliasErrorMsg && (
            <Typography color='destructive' size={TypographySize.SMALL}>
              {aliasErrorMsg}
            </Typography>
          )}
        </>
      )}
      {!showConfirmProvision && (
        <>
          <HeaderInput>
            <Typography color='secondary' size={TypographySize.CAPTION} uppercase>
              New email
            </Typography>
            <EmailAliasContainer>
              <NewEmailAliasInput
                customDomains={availableCustomDomains}
                forceTheme={isMobile ? ThemeMode.DARK : undefined}
                newAlias={alias}
                postSubmitError={aliasErrorMsg}
                preSubmitError={aliasErrorMsg}
                selectedCustomDomain={customDomain}
                setAlias={setAlias}
                setCustomDomain={setCustomDomain}
                setPostSubmitError={setAliasErrorMsg}
                setPreSubmitError={setAliasErrorMsg}
                username={alias}
              />
              {isMobile && <div style={{ marginBottom: '16px' }} />}
            </EmailAliasContainer>
          </HeaderInput>
          <HeaderInput>
            <Typography color='secondary' size={TypographySize.CAPTION} uppercase>
              Temporary password
            </Typography>
            <InputField
              endAdornment={
                <InputFieldEndAction
                  forceTheme={isMobile ? ThemeMode.DARK : undefined}
                  icon={Icon.Reload}
                  onClick={() => {
                    setPassword(generateRandomPassword());
                  }}
                />
              }
              error={passwordErrorMsg}
              forceTheme={isMobile ? ThemeMode.DARK : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPasswordErrorMsg('');
                setPassword(e.target.value);
              }}
              placeholder='Temporary password'
              value={password}
            />
          </HeaderInput>
          {!isMobile && <InputFieldDivider />}
          <InputField
            error={deliveryEmailErrorMsg}
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
        <ButtonGroup
          forceTheme={isMobile ? ThemeMode.DARK : undefined}
          fullWidth={isMobile}
          layout={isMobile ? Layout.STACKED : Layout.INLINE}
        >
          {footerButtonGroupItems.map((item, index) => (
            <ButtonGroupItem key={index} label={item.label} loading={item.loading} onClick={item.onClick} />
          ))}
        </ButtonGroup>
      </Footer>
    </>
  );
};

export default ProvisionAccount;
