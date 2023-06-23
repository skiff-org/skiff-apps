import { ApolloError } from '@apollo/client';
import { useAnimation, motion } from 'framer-motion';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogTypes,
  Divider,
  DropdownItem,
  Icon,
  IconButton,
  Icons,
  InputField,
  Select,
  Size,
  Type,
  Typography,
  TypographySize,
  MonoTag,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import pluralize from 'pluralize';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  useGetAliasesOnDomainQuery,
  useDeleteCustomDomainMutation,
  useGetDomainDetailsQuery,
  useVerifyCustomDomainMutation,
  useSetCatchallAddressMutation
} from 'skiff-front-graphql';
import {
  ConfirmModal,
  useToast,
  renderDate,
  useCreateAlias,
  useAllowAddCustomDomainAliases,
  useCurrentUserEmailAliases,
  TabPage,
  SettingValue,
  useCurrentUserIsOrgAdmin,
  CUSTOM_DOMAIN_SETUP_BLOG
} from 'skiff-front-utils';
import {
  CustomDomainRecord,
  CustomDomainSubscriptionInfo,
  CustomDomainIsDefaultAliasError,
  CustomDomainIsInAllAliasesError,
  isApolloLogicErrorType
} from 'skiff-graphql';
import { CustomDomainStatus, GODADDY_PRICE_SCALE_FACTOR, CatchallEnabledFeatureFlag } from 'skiff-utils';
import styled, { css } from 'styled-components';

import {
  UserFacingCustomDomainStatus,
  getUserFacingVerificationStatus,
  EXPIRES_SOON_BUFFER_IN_MS,
  getErrorStatusForDnsRecord
} from '../../../../utils/customDomainUtils';
import { useSettings } from '../../useSettings';
import DnsRecordHeader from '../DnsRecordHeader';
import DnsRecordRow from '../DnsRecordRow';
import VerticalDnsRecord from '../VerticalDnsRecord';

import DomainVerificationErrorBanner from './DomainVerificationErrorBanner';
import ManageCustomDomainDropdown from './ManageCustomDomainDropdown';

const ManageCustomDomainRowContainer = styled.div`
  background: var(--bg-overlay-tertiary);
  border-radius: 8px;
`;

const ManageCustomDomainRowBlock = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px;
`;

const DomainName = styled.div`
  flex-shrink: 0;
`;

const DomainNameAndAliases = styled.div`
  display: flex;
  flex-direction: column;
`;

const IconAndName = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const NameAndInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoText = styled.div`
  display: flex;
`;

const InfoTag = styled.div`
  display: flex;
  align-items: center;
  padding: 0 4px;
`;

const RecordsList = styled.div<{ errorDetailView?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${(props) => (props.errorDetailView ? '8px' : '4px')};
  ${(props) => (props.errorDetailView ? ' width: 100%' : 'padding: 12px 8px 20px 8px')};
`;

const CatchallRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 16px 16px 16px;
`;

const DividerContainer = styled.div`
  padding: 0 8px;
`;

const ChooseDefaultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const LabelRadioSelect = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  padding: 8px 12px;
  box-sizing: border-box;
  border-radius: 8px;
  :hover {
    background: var(--bg-cell-hover);
  }
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const CheckedIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #ef5a3c;
  outline: 2px solid var(--accent-orange-secondary);
  box-shadow: var(--shadow-l2);
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  display: flex;
  justify-content: center;
`;

const CheckedIconDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  background: var(--icon-always-white);
  box-shadow: var(--shadow-l2);
`;

const UnCheckedIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  display: flex;
  justify-content: center;
  opacity: 0.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  ${isMobile &&
  css`
    padding: 0 0 8px 12px;
    gap: 4px;
  `}
`;

const ChevronContainer = styled.div`
  align-self: center;
`;

const RELOAD_ROTATION = 720;
const RELOAD_ANIMATION_S = 1;

const getCustomDomainIcon = (status: UserFacingCustomDomainStatus, expiresSoon: boolean) => {
  switch (status) {
    case UserFacingCustomDomainStatus.VERIFIED:
      if (expiresSoon) {
        return <Icons color='red' icon={Icon.Stopwatch} />;
      }
      return <Icons color='green' icon={Icon.Check} />;
    case UserFacingCustomDomainStatus.PENDING:
      return <Icons color='disabled' icon={Icon.Clock} />;
    case UserFacingCustomDomainStatus.DNS_RECORD_ERROR:
      return <Icons color='destructive' icon={Icon.Warning} />;
  }
};
interface ManageCustomDomainRowProps {
  customDomain: CustomDomainRecord;
  defaultEmailAlias: string;
  dropdownOpen: boolean;
  renewStatus?: Omit<CustomDomainSubscriptionInfo, 'domainID'>;
  refetchCustomDomains: () => void;
  setDefaultEmailAlias: (newAlias: string) => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
}

const ManageCustomDomainRow: React.FC<ManageCustomDomainRowProps> = ({
  customDomain,
  defaultEmailAlias,
  dropdownOpen,
  renewStatus,
  refetchCustomDomains,
  setDefaultEmailAlias,
  setDropdownOpen
}: ManageCustomDomainRowProps) => {
  const {
    createdAt,
    domainID,
    domain,
    dnsRecords,
    verificationStatus: verificationStatusFromDB,
    skiffManaged
  } = customDomain;
  const userFacingVerificationStatus = getUserFacingVerificationStatus(
    verificationStatusFromDB as CustomDomainStatus,
    new Date(createdAt),
    dnsRecords,
    skiffManaged
  );

  const [verifyCustomDomain] = useVerifyCustomDomainMutation();
  const allowAddCustomDomainAliases = useAllowAddCustomDomainAliases();
  const currentUserEmailAliases = useCurrentUserEmailAliases();
  const isCurrentUserOrgAdmin = useCurrentUserIsOrgAdmin();

  const { data: domainDetailsData } = useGetDomainDetailsQuery({
    variables: { domain: customDomain.domain },
    skip: !customDomain.skiffManaged
  });
  const emailAliases = useCurrentUserEmailAliases();
  const hasAliasOnOtherDomain = emailAliases.some((alias) => !alias.endsWith(`@${domain}`));
  const showAddAliasOption =
    allowAddCustomDomainAliases && userFacingVerificationStatus === UserFacingCustomDomainStatus.VERIFIED;

  // Current domain catchall info
  const { data: aliasDomainData, refetch } = useGetAliasesOnDomainQuery({
    variables: { domainID },
    skip: !domainID
  });
  const [setCatchallAddress] = useSetCatchallAddressMutation();
  const currentUserAliasesOnDomain =
    aliasDomainData?.getAliasesOnDomain.domainAliases.map((aliasInfo) => aliasInfo.displayEmailAlias) ?? [];
  const currentCatchall = aliasDomainData?.getAliasesOnDomain.domainAliases.find(
    (elem) => elem.isCatchall
  )?.displayEmailAlias;

  const expiresAt = renewStatus?.supposedEndDate;
  const renewsAuto = !renewStatus?.cancelAtPeriodEnd; // will auto-renew if cancelAtPeriodEnd is *false*
  const renewalPrice = domainDetailsData?.getDomainDetails.renewalDetails.price;
  // State
  const [showDomainInfo, setShowDomainInfo] = useState<boolean>(false);
  const [showAddAlias, setShowAddAlias] = useState<boolean>(false);
  const [showChooseDefault, setShowChooseDefault] = useState<boolean>(false);
  const [showDeleteDomain, setShowDeleteDomain] = useState<boolean>(false);
  const [newAlias, setNewAlias] = useState('');
  const [newDefaultAlias, setNewDefaultAlias] = useState(defaultEmailAlias);
  const [error, setError] = useState<string | undefined>();
  const [rotation, setRotation] = useState(RELOAD_ROTATION);
  const [postDeleteError, setPostDeleteError] = useState<string>('');
  const [resolveDnsErrorModal, setResolveDnsErrorModal] = useState<boolean>(false);

  // Refs
  const ref = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { enqueueToast } = useToast();
  const { addCustomDomainAlias } = useCreateAlias();
  const controls = useAnimation();

  // Graphql
  const [deleteCustomDomainMutation] = useDeleteCustomDomainMutation();

  const featureFlags = useFlags();
  const hasCatchallEnabled = featureFlags.catchallEnabled as CatchallEnabledFeatureFlag;

  const { openSettings } = useSettings();

  const openAliasTab = () => openSettings({ tab: TabPage.Aliases, setting: SettingValue.AddEmailAlias });
  const openOrgTab = () => openSettings({ tab: TabPage.Org, setting: SettingValue.OrganizationMemberList });

  const deleteCustomDomain = async () => {
    try {
      await deleteCustomDomainMutation({
        variables: {
          request: {
            domainID
          }
        }
      });
      setShowDeleteDomain(false);
      enqueueToast({ title: 'Custom domain deleted' });
      refetchCustomDomains();
    } catch (e) {
      setShowDeleteDomain(false);
      if (
        e instanceof ApolloError &&
        (isApolloLogicErrorType(e.graphQLErrors[0], CustomDomainIsDefaultAliasError) ||
          isApolloLogicErrorType(e.graphQLErrors[0], CustomDomainIsInAllAliasesError))
      ) {
        const failureDescription = `Failed to delete because${
          isApolloLogicErrorType(e.graphQLErrors[0], CustomDomainIsDefaultAliasError)
            ? ' an organization member has this domain in their default alias. Change the default alias and then try again.'
            : ' an organization member has all of their aliases on this domain. Provision a new alias for them and try again.'
        }`;
        setPostDeleteError(failureDescription);
      } else {
        enqueueToast({ title: 'Delete failed', body: 'Failed to delete custom domain.' });
      }
    }
  };

  const isDefaultCustomDomain = defaultEmailAlias.includes(domain);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setNewAlias(value);
    if (value.length === 0) {
      setError('Please enter an email alias');
    } else if (value.length > 0 && !/^[\w\.-]+$/.test(value)) {
      setError('Please enter only letters, numbers, and periods');
    } else {
      setError(undefined);
    }
  };

  const closeDefaultModal = () => setShowChooseDefault(false);
  const closeAliasModal = () => {
    // Clear text
    setNewAlias('');
    setShowAddAlias(false);
  };

  const addNewAlias = async () => {
    try {
      await addCustomDomainAlias(newAlias, customDomain.domain);
      closeAliasModal();
    } catch (e: any) {
      const { message } = e as ApolloError;
      setError(message);
    }
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void addNewAlias();
  };

  const getDeleteModalContent = () => {
    if (isDefaultCustomDomain || !hasAliasOnOtherDomain) {
      return {
        title: isDefaultCustomDomain ? 'Change your default alias' : 'You need a new alias',
        confirmName: isDefaultCustomDomain ? 'Change default' : 'Add new alias',
        description: isDefaultCustomDomain
          ? "You can't delete a domain that is being used in your default alias."
          : 'All of your aliases are on this domain. Create a new @skiff.com alias and then try again.',
        onConfirm: openAliasTab
      };
    }
    return {
      title: `Permanently delete ${domain}?`,
      confirmName: 'Delete',
      description: `WARNING: This will delete the domain and all associated aliases for everyone in your organization${
        skiffManaged ? ', and immediately cancel your annual subscription for this domain' : ''
      }.`,
      destructive: true,
      onConfirm: deleteCustomDomain
    };
  };

  const { title, confirmName, description, destructive, onConfirm } = getDeleteModalContent();

  const inputField = (
    <InputField
      autoFocus
      endAdornment={<Typography>@{domain}</Typography>}
      errorMsg={error}
      helperText='You can use letters, numbers, periods, dashes, and underscores.'
      onChange={onInputChange}
      onKeyPress={submitOnEnter}
      placeholder='alias'
      size={Size.LARGE}
      value={newAlias}
    />
  );

  const currentCustomAliases = currentUserEmailAliases.filter((alias) => alias.split('@')[1] === domain);

  const renderInfoText = () => {
    if (userFacingVerificationStatus === UserFacingCustomDomainStatus.DNS_RECORD_ERROR) {
      if (customDomain.skiffManaged) {
        return 'Please contact support@skiff.org';
      }
      return showDomainInfo
        ? 'Copy the highlighted records into your DNS provider to ensure they match.'
        : 'Verification failed.';
    }
    if (userFacingVerificationStatus === UserFacingCustomDomainStatus.PENDING) {
      if (customDomain.skiffManaged) {
        return `Your domain is registered! DNS records may take a few hours to update`;
      }
      return 'Verification may take a few hours';
    }
    if (!customDomain.skiffManaged) {
      // no icon shown in mobile, so we specify that it's verified
      return isMobile ? 'Verified, externally managed domain' : 'Externally managed domain';
    }
    if (expiresAt) {
      let renewsOrExpiresText = (renewsAuto ? 'Renews ' : 'Expires ') + renderDate(expiresAt);
      if (renewalPrice && renewsAuto) {
        renewsOrExpiresText += ` for $${(renewalPrice * GODADDY_PRICE_SCALE_FACTOR).toFixed(2)} (subject to change)`;
      }
      return renewsOrExpiresText;
    }
  };

  const expiresSoon =
    expiresAt instanceof Date && !renewsAuto && Date.now() > expiresAt.getTime() - EXPIRES_SOON_BUFFER_IN_MS;

  const getInfoTextColor = () => {
    if (expiresSoon) {
      return 'destructive';
    }
    return 'disabled';
  };
  const hasDNSRecordError = userFacingVerificationStatus === UserFacingCustomDomainStatus.DNS_RECORD_ERROR;

  const erroneousRecords = dnsRecords.filter((dnsRecord) =>
    getErrorStatusForDnsRecord(userFacingVerificationStatus, dnsRecord)
  );

  const catchallSelectItems = currentUserAliasesOnDomain.sort().map((domainAlias) => {
    return (
      <DropdownItem
        active={currentCatchall === domainAlias}
        key={domainAlias}
        label={domainAlias}
        value={domainAlias}
      />
    );
  });

  if (currentCatchall) {
    catchallSelectItems.push(
      <DropdownItem
        color='destructive'
        label='Remove'
        onClick={() => {
          void setCatchallAddress({
            variables: {
              request: {
                domainID
              }
            }
          }).then(() => refetch());
        }}
      />
    );
  }

  const canSetCatchall =
    hasCatchallEnabled &&
    catchallSelectItems.length > 0 &&
    userFacingVerificationStatus === UserFacingCustomDomainStatus.VERIFIED;
  // skiff managed domains don't display DNS records; only show dropdown button if catchall setting enabled
  const hasDomainInfoPane = !isMobile && (!skiffManaged || canSetCatchall);

  const renderButtonActions = () => (
    <ButtonContainer>
      {!skiffManaged && userFacingVerificationStatus !== UserFacingCustomDomainStatus.VERIFIED && (
        <motion.div
          animate={controls}
          initial={false}
          key='refresh'
          transition={{
            duration: RELOAD_ANIMATION_S,
            ease: 'easeInOut',
            times: [0, 0.2, 0.5, 0.8, 1]
          }}
        >
          <IconButton
            filled={isMobile ? true : false}
            icon={Icon.Reload}
            iconColor={isMobile ? 'secondary' : undefined}
            onClick={() => {
              async function verifyAndRefetch() {
                await verifyCustomDomain({
                  variables: {
                    domainId: domainID
                  }
                });
                refetchCustomDomains();
              }
              void verifyAndRefetch();
              void controls.start({ rotate: rotation });
              setRotation((prev) => prev + 720);
            }}
            size={isMobile ? undefined : Size.SMALL}
            tooltip='Refetch'
            type={isMobile ? Type.SECONDARY : undefined}
          />
        </motion.div>
      )}
      {/* Hide status tag if verified or on mobile */}
      {!isMobile && userFacingVerificationStatus !== UserFacingCustomDomainStatus.VERIFIED && (
        <InfoTag>
          <MonoTag
            bgColor={hasDNSRecordError ? undefined : 'var(--bg-overlay-tertiary)'}
            color={hasDNSRecordError ? 'red' : undefined}
            label={userFacingVerificationStatus}
            textColor={hasDNSRecordError ? undefined : 'secondary'}
          />
        </InfoTag>
      )}
      {/* all dropdown items except, in some cases, 'Add alias' are only available to admins */}
      {(isCurrentUserOrgAdmin || showAddAliasOption) && (
        <IconButton
          filled={isMobile ? true : false}
          icon={Icon.OverflowH}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          ref={ref}
          size={isMobile ? undefined : Size.SMALL}
          type={isMobile ? Type.SECONDARY : undefined}
        />
      )}
      {hasDomainInfoPane && dnsRecords.length > 0 && (
        <IconButton
          icon={showDomainInfo ? Icon.ChevronDown : Icon.ChevronRight}
          onClick={() => setShowDomainInfo((current) => !current)}
          size={isMobile ? undefined : Size.SMALL}
        />
      )}
    </ButtonContainer>
  );

  return (
    <ManageCustomDomainRowContainer>
      <ManageCustomDomainRowBlock>
        <DomainNameAndAliases>
          <IconAndName>
            {!isMobile && getCustomDomainIcon(userFacingVerificationStatus, expiresSoon)}
            <NameAndInfo>
              <DomainName>
                <Typography minWidth='80px' weight={TypographyWeight.MEDIUM}>
                  {domain}
                </Typography>
              </DomainName>
              <InfoText>
                <Typography color={getInfoTextColor()} size={TypographySize.SMALL} wrap>
                  {renderInfoText()}
                </Typography>
                {!skiffManaged &&
                  !showDomainInfo &&
                  userFacingVerificationStatus === UserFacingCustomDomainStatus.DNS_RECORD_ERROR && (
                    <Typography color='link' onClick={() => setShowDomainInfo(true)} size={TypographySize.SMALL} wrap>
                      &nbsp;Check errors
                    </Typography>
                  )}
              </InfoText>
            </NameAndInfo>
          </IconAndName>
        </DomainNameAndAliases>
        {isMobile ? (
          <>
            {(isCurrentUserOrgAdmin || showAddAliasOption) && (
              <ChevronContainer>
                <Icons
                  color='disabled'
                  icon={showDomainInfo ? Icon.ChevronDown : Icon.ChevronRight}
                  onClick={() => setShowDomainInfo((prev) => !prev)}
                />
              </ChevronContainer>
            )}
          </>
        ) : (
          renderButtonActions()
        )}
      </ManageCustomDomainRowBlock>
      {showDomainInfo && (
        <>
          {isMobile && renderButtonActions()}
          {/* users with Skiff-managed domains don't need to see records since they can't make adjustments */}
          {!!dnsRecords.length &&
            !skiffManaged &&
            (isMobile ? (
              dnsRecords.map((record) => (
                <VerticalDnsRecord dnsRecord={record} domainStatus={userFacingVerificationStatus} key={record.data} />
              ))
            ) : (
              <>
                {userFacingVerificationStatus === UserFacingCustomDomainStatus.DNS_RECORD_ERROR && (
                  <DomainVerificationErrorBanner
                    errorCount={erroneousRecords.length}
                    onCTAClick={() => setResolveDnsErrorModal(true)}
                  />
                )}
                <DividerContainer>
                  <Divider color='tertiary' />
                </DividerContainer>
                <RecordsList>
                  <DnsRecordHeader />
                  {dnsRecords.map((record) => (
                    <DnsRecordRow dnsRecord={record} domainStatus={userFacingVerificationStatus} key={record.data} />
                  ))}
                </RecordsList>
              </>
            ))}
        </>
      )}
      {showDomainInfo && canSetCatchall && (
        <>
          <DividerContainer>
            <Divider color='tertiary' />
          </DividerContainer>
          <CatchallRow>
            <TitleContainer>
              <Typography>Set a catch-all address</Typography>
            </TitleContainer>
            <div>
              <Select
                filled
                maxHeight={400}
                onChange={(value) => {
                  void setCatchallAddress({
                    variables: {
                      request: {
                        domainID,
                        emailAlias: value
                      }
                    }
                  }).then(() => void refetch());
                }}
                placeholder={currentCatchall ?? 'None'}
                size={Size.SMALL}
                value={currentCatchall ?? 'None'}
              >
                {catchallSelectItems}
              </Select>
            </div>
          </CatchallRow>
        </>
      )}
      <Dialog
        description='Add a new custom address.'
        inputField={inputField}
        onClose={closeAliasModal}
        open={showAddAlias}
        title='Add alias'
        type={DialogTypes.Input}
      >
        <ButtonGroupItem label='Add' onClick={() => void addNewAlias()} />
        <ButtonGroupItem label='Cancel' onClick={closeAliasModal} />
      </Dialog>
      <ConfirmModal
        confirmName={confirmName}
        description={description}
        destructive={destructive}
        onClose={() => setShowDeleteDomain(false)}
        onConfirm={onConfirm}
        open={showDeleteDomain}
        title={title}
      />
      <ConfirmModal
        confirmName='Manage aliases'
        description={postDeleteError}
        onClose={() => setPostDeleteError('')}
        onConfirm={openOrgTab}
        open={!!postDeleteError}
        title='Custom domain is still in use'
      />
      <Dialog
        customContent
        onClose={closeDefaultModal}
        open={showChooseDefault}
        title='Choose a default address'
        type={DialogTypes.Confirm}
      >
        <ChooseDefaultList>
          {currentCustomAliases.map((alias) => (
            <LabelRadioSelect key={`${customDomain.domainID}-${alias}`} onClick={() => setNewDefaultAlias(alias)}>
              <Typography maxWidth='260px'>{alias}</Typography>
              {newDefaultAlias === alias && (
                <CheckedIcon>
                  <CheckedIconDot />
                </CheckedIcon>
              )}
              {newDefaultAlias !== alias && (
                <UnCheckedIcon>
                  <Icons color='secondary' icon={Icon.RadioEmpty} size={Size.X_MEDIUM} />
                </UnCheckedIcon>
              )}
            </LabelRadioSelect>
          ))}
        </ChooseDefaultList>
        <ButtonGroup>
          <ButtonGroupItem
            label='Save'
            onClick={() => {
              void setDefaultEmailAlias(newDefaultAlias);
              closeDefaultModal();
            }}
          />
          <ButtonGroupItem label='Cancel' onClick={closeDefaultModal} />
        </ButtonGroup>
      </Dialog>
      <Dialog
        customContent
        disableTextSelect
        onClose={() => setResolveDnsErrorModal(false)}
        open={resolveDnsErrorModal}
        title='Fix DNS record configuration'
        type={DialogTypes.Landscape}
      >
        <Typography color='secondary' size={TypographySize.MEDIUM} wrap>
          {`Please visit your DNS provider for '${domain}' to amend the ${pluralize(
            'record',
            erroneousRecords.length
          )} below.`}
          &nbsp;Learn more about setting up your domain&nbsp;
          <a href={CUSTOM_DOMAIN_SETUP_BLOG} rel='noopener noreferrer' target='_blank'>
            here
          </a>
          .
        </Typography>
        <RecordsList errorDetailView>
          <DnsRecordHeader errorDetailView />
          {erroneousRecords.map((record) => (
            <DnsRecordRow
              dnsRecord={record}
              domainStatus={userFacingVerificationStatus}
              errorDetailView
              key={record.data}
            />
          ))}
        </RecordsList>
      </Dialog>
      <ManageCustomDomainDropdown
        buttonRef={ref}
        openDeleteDomainModal={() => setShowDeleteDomain(true)}
        renewsAuto={renewsAuto}
        setShowAddAlias={(value) => setShowAddAlias(value)}
        setShowDropdown={(value) => setDropdownOpen(value)}
        showAddAliasOption={showAddAliasOption}
        showDropdown={dropdownOpen}
        skiffManaged={customDomain.skiffManaged}
      />
    </ManageCustomDomainRowContainer>
  );
};

export default ManageCustomDomainRow;
