import { ApolloError } from '@apollo/client';
import { motion, useAnimation } from 'framer-motion';
import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogType,
  DISPLAY_SCROLLBAR_CSS,
  Divider,
  Dropdown,
  DropdownItem,
  FilledVariant,
  getThemedColor,
  Icon,
  Icons,
  IconText,
  InputField,
  MonoTag,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  useDeleteCustomDomainMutation,
  useGetAliasesOnDomainQuery,
  useGetDomainDetailsQuery,
  useSetCatchallAddressMutation,
  useVerifyCustomDomainMutation
} from 'skiff-front-graphql';
import {
  ConfirmModal,
  CUSTOM_DOMAIN_SETUP_BLOG,
  renderDate,
  SettingValue,
  simpleSubStringSearchFilter,
  TabPage,
  useAllowAddCustomDomainAliases,
  useCreateAlias,
  useCurrentUserEmailAliases,
  useCurrentUserIsOrgAdmin,
  useToast
} from 'skiff-front-utils';
import {
  CustomDomainIsDefaultAliasError,
  CustomDomainIsInAllAliasesError,
  CustomDomainRecord,
  CustomDomainSubscriptionInfo,
  getPaywallErrorCode,
  isApolloLogicErrorType
} from 'skiff-graphql';
import { CustomDomainStatus, GODADDY_PRICE_SCALE_FACTOR } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { usePaywall } from '../../../../hooks/usePaywall';
import {
  EXPIRES_SOON_BUFFER_IN_MS,
  getErrorStatusForDnsRecord,
  getUserFacingVerificationStatus,
  UserFacingCustomDomainStatus
} from '../../../../utils/customDomainUtils';
import { useSettings } from '../../useSettings';
import DnsRecordHeader from '../DnsRecordHeader';
import DnsRecordRow from '../DnsRecordRow';
import VerticalDnsRecord from '../VerticalDnsRecord';

import DomainVerificationErrorBanner from './DomainVerificationErrorBanner';
import ManageCustomDomainDropdown from './ManageCustomDomainDropdown';

const ManageCustomDomainRowContainer = styled.div<{ $clickable: boolean }>`
  background: var(--bg-overlay-tertiary);
  :hover {
    background: ${({ $clickable }) => ($clickable ? 'var(--bg-overlay-secondary)' : '')};
  }
  border-radius: 8px;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : '')};
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

const CatchallScrollContainer = styled.div<{ $themeMode: ThemeMode }>`
  overflow-y: auto;
  max-height: 200px;
  width: 100%;
  ${DISPLAY_SCROLLBAR_CSS}
`;

const CatchallDropdownFooter = styled.div<{ $showBorder: boolean }>`
  width: 100%;

  // Only add padding-top and margin-top when there is a border
  ${({ $showBorder }) =>
    $showBorder &&
    `
      padding-top: 4px;
      margin-top: 4px;
      box-sizing: border-box;
      border-top: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};
  `}
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
  align-items: center;
  gap: 4px;
  ${isMobile &&
  css`
    padding: 0 0 8px 12px;
  `}
`;

const ChevronContainer = styled.div`
  align-self: center;
`;

const IconContainer = styled.div<{ $bgColor?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: ${({ $bgColor }) => $bgColor || ''};
`;

const RELOAD_ROTATION = 720;
const RELOAD_ANIMATION_S = 1;

const getCustomDomainIcon = (status: UserFacingCustomDomainStatus, expiresSoon: boolean) => {
  switch (status) {
    case UserFacingCustomDomainStatus.VERIFIED:
      if (expiresSoon) {
        return (
          <IconContainer $bgColor='var(--bg-overlay-destructive)'>
            <Icons color='red' icon={Icon.Stopwatch} />
          </IconContainer>
        );
      }
      return (
        <IconContainer $bgColor='var(--accent-green-secondary)'>
          <Icons color='green' icon={Icon.Check} />
        </IconContainer>
      );
    case UserFacingCustomDomainStatus.PENDING:
      return (
        <IconContainer $bgColor='var(--bg-overlay-tertiary)'>
          <Icons color='disabled' icon={Icon.Clock} />
        </IconContainer>
      );
    case UserFacingCustomDomainStatus.DNS_RECORD_ERROR:
      return (
        <IconContainer $bgColor='var(--bg-overlay-destructive)'>
          <Icons color='destructive' icon={Icon.Warning} />
        </IconContainer>
      );
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
  const openPaywallModal = usePaywall();

  const [verifyCustomDomain] = useVerifyCustomDomainMutation();
  const allowAddCustomDomainAliases = useAllowAddCustomDomainAliases();
  const { emailAliases: currentUserEmailAliases } = useCurrentUserEmailAliases();
  const isCurrentUserOrgAdmin = useCurrentUserIsOrgAdmin();

  const { data: domainDetailsData } = useGetDomainDetailsQuery({
    variables: { domain: customDomain.domain },
    skip: !customDomain.skiffManaged
  });
  const { emailAliases } = useCurrentUserEmailAliases();
  const hasAliasOnOtherDomain = emailAliases.some((alias) => !alias.endsWith(`@${domain}`));
  const showAddAliasOption =
    allowAddCustomDomainAliases && userFacingVerificationStatus === UserFacingCustomDomainStatus.VERIFIED;

  // Current domain catchall info
  const { data: aliasDomainData, refetch } = useGetAliasesOnDomainQuery({
    variables: { domainID },
    skip: !domainID,
    fetchPolicy: 'cache-and-network'
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
  const [isCatchallDropdownOpen, setIsCatchallDropdownOpen] = useState(false);
  const [catchallSearchValue, setCatchallSearchValue] = useState('');
  const [highlightedCatchallIndex, setHighlightedCatchallIndex] = useState<number>(0);

  // Refs
  const ref = useRef<HTMLDivElement>(null);
  const catchallButtonRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { enqueueToast } = useToast();
  const { addCustomDomainAlias } = useCreateAlias();
  const controls = useAnimation();

  // Graphql
  const [deleteCustomDomainMutation] = useDeleteCustomDomainMutation();
  const { openSettings } = useSettings();

  const openAliasTab = () => openSettings({ tab: TabPage.Addresses, setting: SettingValue.AddEmailAlias });
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

  // ensure domain info is up to date when user opens detail dropdown
  useEffect(() => {
    if (!showDomainInfo) return;
    if (verificationStatusFromDB === CustomDomainStatus.FAILED_REVERIFICATION) {
      void verifyCustomDomain({
        variables: {
          domainId: domainID
        }
      });
    }
    refetchCustomDomains();
  }, [showDomainInfo, verificationStatusFromDB, domainID, refetchCustomDomains, verifyCustomDomain]);

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
      error={error}
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

  // Not passing an emailAlias means we are removing the catch-all address
  const runSetCatchallAddress = async (emailAlias?: string) => {
    try {
      await setCatchallAddress({ variables: { request: { domainID, emailAlias } } });
      void refetch();
    } catch (e) {
      if (e instanceof ApolloError) {
        const paywallErrorCode = getPaywallErrorCode(e.graphQLErrors);
        if (paywallErrorCode) {
          openPaywallModal(paywallErrorCode);
          return;
        }
      }
      console.error('Failed to set catch-all address:', e);
    }
  };

  const catchallSelectItems = simpleSubStringSearchFilter(currentUserAliasesOnDomain, catchallSearchValue)
    .sort()
    .map((domainAlias, index) => {
      const onHover = () => setHighlightedCatchallIndex(index);
      return (
        <DropdownItem
          endElement={
            currentCatchall === domainAlias ? <Icons forceTheme={ThemeMode.DARK} icon={Icon.Check} /> : undefined
          }
          highlight={highlightedCatchallIndex !== undefined ? index === highlightedCatchallIndex : undefined}
          key={domainAlias}
          label={domainAlias}
          onClick={() => runSetCatchallAddress(domainAlias)}
          onHover={onHover}
        />
      );
    });

  const canSetCatchall =
    currentUserAliasesOnDomain.length > 0 && userFacingVerificationStatus === UserFacingCustomDomainStatus.VERIFIED;
  // skiff managed domains don't display DNS records; only show dropdown button if catchall setting enabled
  const hasDomainInfoPane = !isMobile && (!skiffManaged || canSetCatchall);
  const numCatchcallDropdownItems =
    catchallSelectItems.length + (showAddAliasOption ? 1 : 0) + (currentCatchall ? 1 : 0);
  // The Add alias button precedes the Remove button if it exists
  const addAliasItemIndex = numCatchcallDropdownItems - 1 - (currentCatchall ? 1 : 0);
  // The Remove button is always the last dropdown item
  const removeItemIndex = numCatchcallDropdownItems - 1;

  const hasDomainDetails = hasDomainInfoPane && dnsRecords.length > 0;

  const renderButtonActions = () => (
    <ButtonContainer>
      {/* Hide status tag if verified or on mobile */}
      {!isMobile && userFacingVerificationStatus !== UserFacingCustomDomainStatus.VERIFIED && (
        <InfoTag>
          <MonoTag color={hasDNSRecordError ? 'red' : 'secondary'} label={userFacingVerificationStatus} />
        </InfoTag>
      )}
      {!skiffManaged && userFacingVerificationStatus !== UserFacingCustomDomainStatus.VERIFIED && (
        <IconText
          color='secondary'
          key='refresh'
          onClick={(e?: React.MouseEvent) => {
            e?.stopPropagation();
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
          startIcon={
            <motion.div
              animate={controls}
              initial={false}
              transition={{
                duration: RELOAD_ANIMATION_S,
                ease: 'easeInOut',
                times: [0, 0.2, 0.5, 0.8, 1]
              }}
            >
              <Icons color='secondary' icon={Icon.Reload} size={14} />
            </motion.div>
          }
          tooltip='Refetch'
          variant={isMobile ? FilledVariant.FILLED : FilledVariant.UNFILLED}
        />
      )}
      {/* all dropdown items except, in some cases, 'Add alias' are only available to admins */}
      {(isCurrentUserOrgAdmin || showAddAliasOption) && (
        <IconText
          color='secondary'
          onClick={(e?: React.MouseEvent) => {
            e?.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
          ref={ref}
          size={isMobile ? undefined : Size.SMALL}
          startIcon={Icon.OverflowH}
          variant={isMobile ? FilledVariant.FILLED : FilledVariant.UNFILLED}
        />
      )}
      {hasDomainDetails && (
        <IconText
          color='secondary'
          onClick={(e?: React.MouseEvent) => {
            e?.stopPropagation();
            setShowDomainInfo((current) => !current);
          }}
          size={isMobile ? undefined : Size.SMALL}
          startIcon={showDomainInfo ? Icon.ChevronDown : Icon.ChevronRight}
        />
      )}
    </ButtonContainer>
  );

  return (
    <ManageCustomDomainRowContainer
      $clickable={!showDomainInfo && hasDomainDetails}
      onClick={() => (!showDomainInfo ? setShowDomainInfo((current) => !current) : {})}
    >
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
                  isCurrentUserOrgAdmin &&
                  userFacingVerificationStatus === UserFacingCustomDomainStatus.DNS_RECORD_ERROR && (
                    <Typography color='link' size={TypographySize.SMALL} wrap>
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
      {canSetCatchall && (
        <>
          <DividerContainer>
            <Divider color='tertiary' />
          </DividerContainer>
          <CatchallRow onClick={(e) => e.stopPropagation()}>
            <TitleContainer>
              <Typography>Set a catch-all address</Typography>
            </TitleContainer>
            <div>
              <IconText
                endIcon={isCatchallDropdownOpen ? Icon.ChevronUp : Icon.ChevronDown}
                label={currentCatchall ?? 'None'}
                onClick={() => setIsCatchallDropdownOpen(!isCatchallDropdownOpen)}
                ref={catchallButtonRef}
                variant={FilledVariant.FILLED}
              />
              <Dropdown
                buttonRef={catchallButtonRef}
                inputField={
                  <InputField onChange={(e) => setCatchallSearchValue(e.target.value)} value={catchallSearchValue} />
                }
                keyboardNavControls={{
                  idx: highlightedCatchallIndex,
                  setIdx: setHighlightedCatchallIndex,
                  numItems: numCatchcallDropdownItems
                }}
                minWidth={280}
                portal
                setShowDropdown={setIsCatchallDropdownOpen}
                showDropdown={isCatchallDropdownOpen}
              >
                <CatchallScrollContainer $themeMode={ThemeMode.DARK}>{catchallSelectItems}</CatchallScrollContainer>
                {(showAddAliasOption || currentCatchall) && (
                  <CatchallDropdownFooter $showBorder={!!catchallSelectItems.length}>
                    {showAddAliasOption && (
                      <DropdownItem
                        highlight={highlightedCatchallIndex === addAliasItemIndex}
                        icon={Icon.Plus}
                        label='Add address'
                        onClick={() => {
                          setShowAddAlias(true);
                          setIsCatchallDropdownOpen(false);
                        }}
                        onHover={() => setHighlightedCatchallIndex(addAliasItemIndex)}
                      />
                    )}
                    {currentCatchall && (
                      <DropdownItem
                        color='destructive'
                        highlight={highlightedCatchallIndex === removeItemIndex}
                        icon={Icon.Trash}
                        label='Remove catch-all'
                        onClick={() => runSetCatchallAddress()}
                        onHover={() => setHighlightedCatchallIndex(removeItemIndex)}
                      />
                    )}
                  </CatchallDropdownFooter>
                )}
              </Dropdown>
            </div>
          </CatchallRow>
        </>
      )}
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
                {userFacingVerificationStatus !== UserFacingCustomDomainStatus.DNS_RECORD_ERROR && (
                  <DividerContainer>
                    <Divider color='tertiary' />
                  </DividerContainer>
                )}
                <RecordsList>
                  <DnsRecordHeader />
                  {dnsRecords.map((record) => (
                    <DnsRecordRow
                      dnsRecord={record}
                      domainStatus={userFacingVerificationStatus}
                      key={record.data}
                      openResolve={() => setResolveDnsErrorModal(true)}
                    />
                  ))}
                </RecordsList>
              </>
            ))}
        </>
      )}
      <Dialog
        description='Add a new custom address.'
        inputField={inputField}
        onClose={closeAliasModal}
        open={showAddAlias}
        title='Add address'
        type={DialogType.INPUT}
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
        confirmName='Manage addresses'
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
        type={DialogType.CONFIRM}
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
        size={Size.LARGE}
        title='Fix DNS record configuration'
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
            <>
              <DnsRecordRow
                dnsRecord={record}
                domainStatus={userFacingVerificationStatus}
                errorDetailView
                key={record.data}
              />
            </>
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
