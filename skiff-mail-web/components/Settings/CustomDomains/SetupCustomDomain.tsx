import { useFlags } from 'launchdarkly-react-client-sdk';
import {
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Divider,
  Icon,
  InputField,
  Surface,
  Tabs,
  ThemeMode,
  themeNames,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  useGenerateCustomDomainRecordsMutation,
  useGetOrganizationQuery,
  useSaveCustomDomainRecordsMutation
} from 'skiff-front-graphql';
import {
  TitleActionSection,
  useToast,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { useLocalSetting } from 'skiff-front-utils';
import {
  DnsRecord,
  PermissionLevel,
  CustomDomainRecord,
  getPaywallErrorCode,
  WorkspaceEventType,
  SubscriptionPlan
} from 'skiff-graphql';
import {
  PaywallErrorCode,
  StorageTypes,
  FreeTierCustomDomainsFeatureFlag,
  getMaxCustomDomains,
  FreeTrialIdentifier,
  getFreeTrialTier
} from 'skiff-utils';
import styled from 'styled-components';

import { useMaxCustomDomains } from '../../../hooks/useMaxCustomDomains';
import { usePaywall } from '../../../hooks/usePaywall';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../../utils/userUtils';
import { useSubscriptionPlan } from '../../../utils/userUtils';

import DnsRecordHeader from './DnsRecordHeader';
import DnsRecordRow from './DnsRecordRow';
import VerticalDnsRecord from './VerticalDnsRecord';

export const BUY_DOMAIN_CTA = 'Find your domain';

interface SetupCustomDomainProps {
  numExistingCustomDomains: number;
  existingCustomDomains: CustomDomainRecord[];
  refetchCustomDomains: () => void;
}

const BannerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  min-width: fit-content;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NextButtonContainer = styled.div`
  margin-top: 16px;
  align-self: end;
`;

const DnsRecordsButtonGroupContainer = styled.div`
  margin-top: 16px;
`;

const MobileButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddRecordsPrompt = styled.div`
  margin-bottom: 12px;
`;

const MobileRecordTableHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 0 16px;
`;

const MobileDnsSetupContainer = styled.div`
  background: var(--bg-overlay-tertiary);
  border-radius: 8px;
`;

const IllustrationContainer = styled.div`
  position: absolute;
  width: 216px;
  right: 0;
  height: 100%;
  top: 0;
  overflow: hidden;
`;

const IllustrationTilt = styled.div<{ $rotate: number; $top: number; $left: number }>`
  position: absolute;
  top: ${(props) => props.$top}px;
  left: ${(props) => props.$left}px;
  transform: ${(props) => `rotate(${props.$rotate}deg)`};
  filter: drop-shadow(0px 2px 0px #fa7157);
  user-select: none;
`;

const IllustrationText = styled.div<{ $fontSize: number }>`
  width: ${(props) => props.$fontSize}px;
  height: ${(props) => props.$fontSize}px;
  font-size: ${(props) => props.$fontSize}px;
  color: #f06b50;
  font-weight: 600;
  user-select: none;
`;

const Square = styled.div`
  width: 18px;
  height: 18px;
  background: rgb(255, 255, 255, 0.1);
  filter: drop-shadow(0px 2px 0px #fa7157);
`;

const OneClickDomainCalloutText = styled.div`
  display: flex;
`;

enum SetupCustomDomainStep {
  InputDomain,
  DnsRecords
}

const INITIAL_SETUP_CUSTOM_DOMAIN_STEP = SetupCustomDomainStep.InputDomain;

const SetupCustomDomain: React.FC<SetupCustomDomainProps> = ({
  numExistingCustomDomains,
  existingCustomDomains,
  refetchCustomDomains
}) => {
  const dispatch = useDispatch();
  const { maxCustomDomains } = useMaxCustomDomains();
  const [open, setOpen] = useState<boolean>(false);
  const [domainName, setDomainName] = useState<string>('');
  const [domainID, setDomainID] = useState<string | undefined>();
  const [activeStep, setActiveStep] = useState<SetupCustomDomainStep>(INITIAL_SETUP_CUSTOM_DOMAIN_STEP);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[] | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSeenCustomDomain, setHasSeenCustomDomain] = useLocalSetting(StorageTypes.HAS_SEEN_CUSTOM_DOMAIN);
  const [hasSeenCustomDomainTrialOffer, setHasSeenCustomDomainTrialOffer] = useLocalSetting(
    StorageTypes.HAS_SEEN_CUSTOM_DOMAIN_TRIAL_OFFER
  );

  const { rootOrgID } = useRequiredCurrentUserData();
  const { data: activeOrg } = useGetOrganizationQuery({
    variables: { id: rootOrgID }
  });
  // only admins can buy one-click custom domains for a workspace
  const currentUserIsOrgAdmin =
    activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;

  const featureFlags = useFlags();
  const hasFreeTierOneClickCustomDomainsFF =
    featureFlags.freeTierOneClickCustomDomains as FreeTierCustomDomainsFeatureFlag;

  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();

  const isFreeTrialOfferAvailable = hasFreeTierOneClickCustomDomainsFF && activeSubscription === SubscriptionPlan.Free;
  const freeTrialTier = getFreeTrialTier(FreeTrialIdentifier.CUSTOM_DOMAIN_PURCHASE_TRIAL);

  // if a user is entitled to a free trial, we model their max custom domains as the amount they'd be entitled to under that trial
  const trialAdjustedMaxCustomDomains = isFreeTrialOfferAvailable
    ? getMaxCustomDomains(freeTrialTier)
    : maxCustomDomains;

  const [generateCustomDomainRecords] = useGenerateCustomDomainRecordsMutation();
  const [saveCustomDomainRecords] = useSaveCustomDomainRecordsMutation();

  const openPaywallModal = usePaywall();

  const { enqueueToast } = useToast();

  const reset = () => {
    setOpen(false);
    setDomainName('');
    setActiveStep(INITIAL_SETUP_CUSTOM_DOMAIN_STEP);
    setErrorMsg('');
  };

  const displayConfirmErrorToast = () => {
    enqueueToast({ title: 'DNS failure', body: 'Failed to save DNS record' });
  };

  // Don't show toasts announcing feature or promotion again
  useEffect(() => {
    if (!hasSeenCustomDomain) {
      setHasSeenCustomDomain(true);
    }
    if (isFreeTrialOfferAvailable && !hasSeenCustomDomainTrialOffer) {
      setHasSeenCustomDomainTrialOffer(true);
    }
  }, []);

  const handleNextFromInputDomain = async () => {
    // note that we use maxCustomDomains, not trialAdjustedMaxCustomDomains here,
    // because users are only entitled to access skiff-managed domain purchase,
    // in advance of redeeming a free trial, since the trial is conditioned on this purchase
    if (existingCustomDomains.length >= (maxCustomDomains ?? 0)) {
      return openPaywallModal(PaywallErrorCode.CustomDomainLimit);
    }

    if (!domainName) {
      setErrorMsg('Must enter a domain name.');
      return;
    }

    setLoading(true);

    const { data, errors } = await generateCustomDomainRecords({
      variables: {
        request: {
          domain: domainName
        }
      },
      errorPolicy: 'all'
    });

    setLoading(false);

    if (errors || !data) {
      const paywallErrorCode = getPaywallErrorCode(errors ?? []);
      if (paywallErrorCode) {
        return openPaywallModal(paywallErrorCode);
      }
      setErrorMsg('Failed to generate custom domain records.');
      console.error(errors);
      return;
    }

    const {
      domainID: returnedDomainID,
      mxRecords,
      dkimRecords,
      spfRecords,
      dmarcRecord
    } = data.generateCustomDomainRecords;

    setDnsRecords([...mxRecords, ...dkimRecords, spfRecords, dmarcRecord]);
    setDomainID(returnedDomainID);
    setActiveStep(SetupCustomDomainStep.DnsRecords);
  };

  const handleDomainInputKeyPress = (e: React.KeyboardEvent<any>) => {
    if (e.key === 'Enter') {
      void handleNextFromInputDomain();
    }
  };

  const handleDomainInputChange = (e: React.ChangeEvent<any>) => {
    setErrorMsg('');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const rawValue: string = e.target.value;
    // Remove spaces
    setDomainName(rawValue.replace(' ', ''));
  };

  const handleConfirm = async () => {
    if (!domainID) {
      displayConfirmErrorToast();
      console.error('Failed to save custom domain records: Missing domainID');
      return;
    }

    setLoading(true);

    const { errors } = await saveCustomDomainRecords({
      variables: {
        request: {
          domain: domainName,
          domainID
        }
      },
      errorPolicy: 'all'
    });

    setLoading(false);

    console.log({ errors });
    if (errors) {
      const paywallErrorCode = getPaywallErrorCode(errors);
      console.log({ paywallErrorCode });
      if (paywallErrorCode) {
        return openPaywallModal(paywallErrorCode);
      }
      displayConfirmErrorToast();
      console.error('Failed to save custom domain records', errors);
      return;
    }

    enqueueToast({ title: 'Custom domain saved', body: 'Custom domain records saved to account.' });
    refetchCustomDomains();
    reset();
  };

  const onClickBuy = () => {
    void storeWorkspaceEvent(
      isFreeTrialOfferAvailable
        ? WorkspaceEventType.BuyCustomDomainWithTrialClick
        : WorkspaceEventType.BuyCustomDomainClick,
      '',
      DEFAULT_WORKSPACE_EVENT_VERSION
    );
    if (numExistingCustomDomains >= (trialAdjustedMaxCustomDomains ?? 0)) {
      return openPaywallModal(PaywallErrorCode.CustomDomainLimit);
    }
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.SearchCustomDomain
      })
    );
  };

  const cancelSetup = () =>
    setOpen((isOpen) => {
      if (isOpen) {
        reset();
        return false;
      } else return true;
    });

  const oneClickCustomDomainBannerCopy = isFreeTrialOfferAvailable
    ? {
        title: 'Get a new domain + 60 days of Skiff Pro',
        body: 'Get two months of Skiff Pro free ($20 value) when you register your perfect domain'
      }
    : {
        title: 'Get a new, personalized domain',
        body: 'Register the perfect domain name for your email in less than 5 minutes'
      };

  // Only admins can buy one-click custom domains for a workspace
  const showBuyCustomDomains = currentUserIsOrgAdmin && !isMobile;

  const renderSetupDnsPrompt = () => (
    <Typography
      color='secondary'
      size={TypographySize.SMALL}
      weight={isMobile ? TypographyWeight.MEDIUM : TypographyWeight.BOLD}
      wrap
    >
      <AddRecordsPrompt>
        Copy these records into your DNS provider and hit &apos;Confirm&apos; — records can take several hours to
        update.
      </AddRecordsPrompt>
    </Typography>
  );

  const renderDnsSetupButtons = () =>
    isMobile ? (
      <MobileButtonContainer>
        <Button fullWidth loading={loading} onClick={handleConfirm} type={Type.PRIMARY}>
          Confirm
        </Button>
        <Button fullWidth onClick={() => setActiveStep(SetupCustomDomainStep.InputDomain)} type={Type.SECONDARY}>
          Back
        </Button>
      </MobileButtonContainer>
    ) : (
      <DnsRecordsButtonGroupContainer>
        <ButtonGroup>
          <ButtonGroupItem
            key='setup-domain-confirm-button'
            label='Confirm'
            loading={loading}
            onClick={handleConfirm}
          />
          <ButtonGroupItem
            key='setup-domain-back-button'
            label='Back'
            onClick={() => setActiveStep(SetupCustomDomainStep.InputDomain)}
          />
        </ButtonGroup>
      </DnsRecordsButtonGroupContainer>
    );
  return (
    <>
      {/* Only admins can buy one-click custom domains for a workspace */}
      {showBuyCustomDomains && (
        <Surface size='full-width' style={{ background: themeNames.light['--icon-link'], position: 'relative' }}>
          <BannerContainer>
            <TextContainer>
              <Typography forceTheme={ThemeMode.DARK} size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
                {oneClickCustomDomainBannerCopy.title}
              </Typography>
              <Typography color='secondary' forceTheme={ThemeMode.DARK}>
                {oneClickCustomDomainBannerCopy.body}
              </Typography>
            </TextContainer>
            <div>
              <Button forceTheme={ThemeMode.DARK} onClick={onClickBuy} type={Type.PRIMARY}>
                {BUY_DOMAIN_CTA}
              </Button>
            </div>
            <IllustrationContainer>
              <IllustrationTilt $left={60} $rotate={-30} $top={20}>
                <IllustrationText $fontSize={86}>@</IllustrationText>
              </IllustrationTilt>
              <IllustrationTilt $left={30} $rotate={28.4} $top={100}>
                <IllustrationText $fontSize={38}>.com</IllustrationText>
              </IllustrationTilt>
              <IllustrationTilt $left={190} $rotate={-0.16} $top={80}>
                <IllustrationText $fontSize={72}>*</IllustrationText>
              </IllustrationTilt>
              <IllustrationTilt $left={0} $rotate={-30} $top={-40}>
                <IllustrationText $fontSize={72}>*</IllustrationText>
              </IllustrationTilt>
              <IllustrationTilt $left={160} $rotate={-30} $top={20}>
                <Square />
              </IllustrationTilt>
            </IllustrationContainer>
          </BannerContainer>
        </Surface>
      )}
      {!showBuyCustomDomains && !isMobile && (
        <Typography size={TypographySize.H3} weight={TypographyWeight.BOLD}>
          Custom domains
        </Typography>
      )}
      <TitleActionSection
        actions={
          isMobile && open
            ? undefined
            : [
                {
                  onClick: cancelSetup,
                  type: 'button',
                  label: open ? 'Cancel' : 'Configure domain'
                }
              ]
        }
        subtitle='Configure a domain you already own to start sending from you@yourwebsite.com'
        title='Configure existing domain'
      />
      {/* Open panel */}
      {open && (
        <>
          {showBuyCustomDomains && (
            <OneClickDomainCalloutText>
              <Typography color='secondary'>Want to find a new domain?</Typography>
              <Typography color='link' onClick={onClickBuy}>
                &nbsp;Try automatic setup
              </Typography>
            </OneClickDomainCalloutText>
          )}
          <Tabs
            tabs={[
              {
                label: '1. Domain',
                active: activeStep === SetupCustomDomainStep.InputDomain,
                onClick: () => setActiveStep(SetupCustomDomainStep.InputDomain)
              },
              {
                label: '2. DNS',
                active: activeStep === SetupCustomDomainStep.DnsRecords
              }
            ]}
          />
          {/* Input domain step */}
          {activeStep === SetupCustomDomainStep.InputDomain && (
            <React.Fragment key='setup-custom-domain-input-domain-step'>
              <InputField
                error={!!errorMsg}
                errorMsg={errorMsg}
                icon={Icon.At}
                onChange={handleDomainInputChange}
                onKeyPress={handleDomainInputKeyPress}
                placeholder='yourdomain.com'
                value={domainName}
              />
              {isMobile ? (
                <MobileButtonContainer>
                  <Button fullWidth loading={loading} onClick={() => void handleNextFromInputDomain()}>
                    Next
                  </Button>
                  <Button fullWidth loading={loading} onClick={cancelSetup} type={Type.SECONDARY}>
                    Cancel
                  </Button>
                </MobileButtonContainer>
              ) : (
                <NextButtonContainer>
                  <Button loading={loading} onClick={() => void handleNextFromInputDomain()}>
                    Next
                  </Button>
                </NextButtonContainer>
              )}
            </React.Fragment>
          )}
          {/* DNS Records step */}
          {activeStep === SetupCustomDomainStep.DnsRecords && (
            <React.Fragment key='setup-custom-domain-dns-record-step'>
              {isMobile ? (
                <>
                  <MobileDnsSetupContainer>
                    <MobileRecordTableHeader>{renderSetupDnsPrompt()}</MobileRecordTableHeader>
                    {dnsRecords?.map((record) => (
                      <VerticalDnsRecord dnsRecord={record} domainStatus={undefined} key={record.data} />
                    ))}
                  </MobileDnsSetupContainer>
                  {renderDnsSetupButtons()}
                </>
              ) : (
                <>
                  {renderSetupDnsPrompt()}
                  <DnsRecordHeader />
                  {dnsRecords?.map((record, index) => (
                    <>
                      <DnsRecordRow dnsRecord={record} domainStatus={undefined} key={record.data} />
                      {index < dnsRecords.length - 1 ? <Divider /> : null}
                    </>
                  ))}
                </>
              )}
              {!isMobile && renderDnsSetupButtons()}
            </React.Fragment>
          )}
        </>
      )}
    </>
  );
};

export default SetupCustomDomain;
