import { ApolloError } from '@apollo/client';
import { useAnimation, motion } from 'framer-motion';
import {
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Chip,
  Dialog,
  DialogTypes,
  Icon,
  IconButton,
  Icons,
  IconTextProps,
  InputField,
  Typography
} from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { ConfirmModal, useToast } from 'skiff-front-utils';
import { CustomDomainRecord, DnsRecord } from 'skiff-graphql';
import { useCreateCustomDomainAliasMutation, useDeleteCustomDomainMutation } from 'skiff-mail-graphql';
import { CustomDomainStatus, CUSTOM_DOMAIN_RECORD_ERRORS } from 'skiff-utils';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';
import { useCurrentUserEmailAliases } from '../../../../hooks/useCurrentUserEmailAliases';
import { updateEmailAliases } from '../../../../utils/cache/cache';
import DnsRecordRow from '../DnsRecordRow';

import ManageCustomDomainDropdown from './ManageCustomDomainDropdown';

const ManageCustomDomainRowContainer = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

const DomainName = styled(Typography)`
  min-width: 80px;
  flex-shrink: 0;
`;

const NameAndAlias = styled.div`
  display: flex;
  flex-direction: column;
`;

const NameAndVerificationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const VerificationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const RecordsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  margin-top: 24px;
`;

const AliasList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  width: 100%;
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
  gap: 8px;
`;

const RELOAD_ROTATION = 720;
const RELOAD_ANIMATION_S = 1;

// Converts errors in DNSRecord array into readable error format
const getDnsRecordErrors = (dnsRecords: Array<DnsRecord>): string[] => {
  const errors: string[] = [];
  for (const { error, type } of dnsRecords) {
    if (!error) {
      continue;
    }
    if (error.errorType === CUSTOM_DOMAIN_RECORD_ERRORS.RECORD_MISMATCH) {
      const retrievedRecords = error.errorData?.retrievedRecords ?? [];
      const additionalText = retrievedRecords.length ? ` (${retrievedRecords.join(', ')})` : '';
      errors.push(`${type} record mismatch${additionalText}`);
    } else {
      errors.push(`${type} error.errorType`);
    }
  }
  return errors;
};

// Convert a CustomDomainStatus into a user facing label
const getCustomDomainStatusLabel = (status: CustomDomainStatus): string => {
  switch (status) {
    case CustomDomainStatus.VERIFIED:
      return 'verified';
    case CustomDomainStatus.PENDING:
      return 'unverified';
    case CustomDomainStatus.FAILED_REVERIFICATION:
      return 'failed';
  }
};

// Convert a CustomDomainStatus into a color for the label
const getCustomDomainStatusColor = (status: CustomDomainStatus): IconTextProps['color'] => {
  switch (status) {
    case CustomDomainStatus.VERIFIED:
      return 'green';
    case CustomDomainStatus.PENDING:
      return 'secondary';
    case CustomDomainStatus.FAILED_REVERIFICATION:
      return 'destructive';
  }
};

interface ManageCustomDomainRowProps {
  customDomain: CustomDomainRecord;
  defaultCustomDomainAlias: string;
  dropdownOpen: boolean;
  refetchCustomDomains: () => void;
  setDefaultCustomDomainAlias: (newAlias: string) => void;
  setDropdownOpen: (open: boolean) => void;
}

const ManageCustomDomainRow: React.FC<ManageCustomDomainRowProps> = ({
  customDomain,
  defaultCustomDomainAlias,
  dropdownOpen,
  refetchCustomDomains,
  setDefaultCustomDomainAlias,
  setDropdownOpen
}: ManageCustomDomainRowProps) => {
  const { domainID, domain, dnsRecords, verificationStatus } = customDomain;
  const { userID } = useRequiredCurrentUserData();
  const currentUserEmailAliases = useCurrentUserEmailAliases();
  // State
  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [showAddAlias, setShowAddAlias] = useState<boolean>(false);
  const [showChooseDefault, setShowChooseDefault] = useState<boolean>(false);
  const [showDeleteDomain, setShowDeleteDomain] = useState<boolean>(false);
  const [newAlias, setNewAlias] = useState('');
  const [newDefaultAlias, setNewDefaultAlias] = useState(defaultCustomDomainAlias);
  const [error, setError] = useState<string | undefined>();
  const [createCustomDomainAlias] = useCreateCustomDomainAliasMutation();
  const [rotation, setRotation] = useState(RELOAD_ROTATION);

  // Refs
  const ref = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { enqueueToast } = useToast();
  const controls = useAnimation();

  // Graphql
  const [deleteCustomDomainMutation] = useDeleteCustomDomainMutation();

  const deleteCustomDomain = async () => {
    const { errors } = await deleteCustomDomainMutation({
      variables: {
        request: {
          domainID
        }
      }
    });

    if (errors) {
      enqueueToast({ body: 'Failed to delete custom domain.', icon: Icon.Warning });
    } else {
      enqueueToast({ body: 'Custom domain deleted.', icon: Icon.Trash });
      refetchCustomDomains();
    }
  };

  const isDefaultCustomDomain = defaultCustomDomainAlias.includes(domain);

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
      await createCustomDomainAlias({
        variables: {
          request: {
            emailAlias: newAlias,
            customDomain: customDomain.domain
          }
        },
        update: (cache, response) => {
          const updatedEmailAliases = response.data?.createCustomDomainAlias?.emailAliases;
          if (!response.errors && updatedEmailAliases) {
            updateEmailAliases(cache, userID, updatedEmailAliases);
          }
        }
      });
      closeAliasModal();
    } catch (e: any) {
      const { message } = e as ApolloError;
      setError(message);
    }
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void addNewAlias();
  };

  const inputField = (
    <InputField
      autoFocus
      endAdornment={<Typography>@{domain}</Typography>}
      errorMsg={error}
      helperText={error || 'You can use letters, numbers, periods, dashes, and underscores.'}
      onChange={onInputChange}
      onKeyPress={submitOnEnter}
      placeholder='alias'
      size='large'
      style={{ paddingRight: `${domain.length * 10}px` }}
      value={newAlias}
    />
  );

  const currentCustomAliases = currentUserEmailAliases.filter((alias) => alias.split('@')[1] === domain);
  const dnsRecordErrors = getDnsRecordErrors(dnsRecords);
  return (
    <div>
      <ManageCustomDomainRowContainer>
        <NameAndAlias>
          <NameAndVerificationStatus>
            <DomainName>{domain}</DomainName>
            <VerificationStatus>
              <Chip
                color={getCustomDomainStatusColor(verificationStatus as CustomDomainStatus)}
                label={getCustomDomainStatusLabel(verificationStatus as CustomDomainStatus)}
                size='small'
              />
              {/* Hide errors if verified */}
              {verificationStatus !== CustomDomainStatus.VERIFIED &&
                dnsRecordErrors.map((errorMsg) => (
                  <Chip color='destructive' key={`${domain}-${errorMsg}`} label={errorMsg} size='small' />
                ))}
              {isDefaultCustomDomain && <Chip active label='default' size='small' />}
            </VerificationStatus>
          </NameAndVerificationStatus>
          <AliasList>
            {currentCustomAliases.map((alias) => (
              <Typography color='secondary' key={`${customDomain.domainID}-${alias}`} level={3}>
                {alias}
              </Typography>
            ))}
          </AliasList>
        </NameAndAlias>
        {!showRecords && (
          <ButtonContainer>
            {verificationStatus === CustomDomainStatus.VERIFIED && (
              <Button onClick={() => setShowAddAlias(true)} type='secondary'>
                Add alias
              </Button>
            )}
            {verificationStatus === CustomDomainStatus.PENDING && (
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
                  color='secondary'
                  icon={Icon.Reload}
                  onClick={() => {
                    void refetchCustomDomains();
                    void controls.start({ rotate: rotation });
                    setRotation((prev) => prev + 720);
                  }}
                  size='small'
                  tooltip='Refetch'
                />
              </motion.div>
            )}
            <IconButton
              color='secondary'
              icon={Icon.OverflowH}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              ref={ref}
              size='small'
            />
          </ButtonContainer>
        )}
        {showRecords && (
          <Typography color='secondary' onClick={() => setShowRecords(false)} type='label'>
            Close
          </Typography>
        )}
      </ManageCustomDomainRowContainer>
      {showRecords && (
        <RecordsList>
          {dnsRecords.map((record) => (
            <DnsRecordRow dnsRecord={record} key={record.data} />
          ))}
        </RecordsList>
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
        confirmName='Delete'
        description='This will delete the domain for everyone in your workspace.'
        destructive
        onClose={() => setShowDeleteDomain(false)}
        onConfirm={deleteCustomDomain}
        open={showDeleteDomain}
        title='Are you sure?'
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
              <Typography style={{ maxWidth: '260px' }}>{alias}</Typography>
              {newDefaultAlias === alias && (
                <CheckedIcon>
                  <CheckedIconDot />
                </CheckedIcon>
              )}
              {newDefaultAlias !== alias && (
                <UnCheckedIcon>
                  <Icons color='secondary' icon={Icon.RadioEmpty} size='large' />
                </UnCheckedIcon>
              )}
            </LabelRadioSelect>
          ))}
        </ChooseDefaultList>
        <ButtonGroup>
          <ButtonGroupItem
            label='Save'
            onClick={() => {
              setDefaultCustomDomainAlias(newDefaultAlias);
              closeDefaultModal();
            }}
          />
          <ButtonGroupItem label='Cancel' onClick={closeDefaultModal} />
        </ButtonGroup>
      </Dialog>
      {/* deleteCustomDomain */}
      <ManageCustomDomainDropdown
        buttonRef={ref}
        setShowDropdown={(value) => setDropdownOpen(value)}
        showDefaultAlias={() => setShowChooseDefault(true)}
        showDefaultOption={currentCustomAliases.length > 0}
        showDeleteDomain={() => setShowDeleteDomain(true)}
        showDropdown={dropdownOpen}
        showRecords={() => setShowRecords(true)}
      />
    </div>
  );
};

export default ManageCustomDomainRow;
