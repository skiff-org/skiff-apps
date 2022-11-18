import {
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Divider,
  Icon,
  Icons,
  InputField,
  Tab,
  Tabs,
  Typography
} from 'nightwatch-ui';
import React, { useState } from 'react';
import { TitleActionSection, useToast } from 'skiff-front-utils';
import { CustomDomainRecord, DnsRecord } from 'skiff-graphql';
import { getPaywallErrorCode } from 'skiff-graphql';
import { useGenerateCustomDomainRecordsMutation, useSaveCustomDomainRecordsMutation } from 'skiff-mail-graphql';
import { PaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { useMaxCustomDomains } from '../../../hooks/useMaxCustomDomains';
import { usePaywall } from '../../../hooks/usePaywall';

import DnsRecordRow from './DnsRecordRow';

const NextButton = styled(Button)`
  margin-top: 16px;
  align-self: end;
`;

const DnsRecordsButtonGroup = styled(ButtonGroup)`
  margin-top: 16px;
`;

const AddRecordsPrompt = styled(Typography)`
  margin-bottom: 12px;
`;

enum SetupCustomDomainStep {
  InputDomain,
  DnsRecords
}

const INITIAL_SETUP_CUSTOM_DOMAIN_STEP = SetupCustomDomainStep.InputDomain;

interface SetupCustomDomainProps {
  existingCustomDomains: CustomDomainRecord[];
  refetchCustomDomains: () => void;
}

const SetupCustomDomain: React.FC<SetupCustomDomainProps> = ({ existingCustomDomains, refetchCustomDomains }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [domainName, setDomainName] = useState<string>('');
  const [domainID, setDomainID] = useState<string | undefined>();
  const [activeStep, setActiveStep] = useState<SetupCustomDomainStep>(INITIAL_SETUP_CUSTOM_DOMAIN_STEP);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[] | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [generateCustomDomainRecords] = useGenerateCustomDomainRecordsMutation();
  const [saveCustomDomainRecords] = useSaveCustomDomainRecordsMutation();

  const openPaywallModal = usePaywall();

  const { enqueueToast } = useToast();

  const { maxCustomDomains } = useMaxCustomDomains();

  const reset = () => {
    setOpen(false);
    setDomainName('');
    setActiveStep(INITIAL_SETUP_CUSTOM_DOMAIN_STEP);
    setErrorMsg('');
  };

  const displayConfirmErrorToast = () => {
    enqueueToast({ body: 'Failed to save DNS record', icon: Icon.Warning });
  };

  const handleNextFromInputDomain = async () => {
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

    enqueueToast({ body: 'Custom domain saved', icon: Icon.Check });
    refetchCustomDomains();
    reset();
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: () =>
              setOpen((isOpen) => {
                if (isOpen) {
                  reset();
                  return false;
                } else return true;
              }),
            type: 'button',
            label: open ? 'Cancel' : 'Add domain'
          }
        ]}
        subtitle='Add a domain you already own to start sending from you@yourwebsite.com'
        title='Add existing domain'
      />
      {/* Open panel */}
      {open && (
        <>
          <Tabs>
            <Tab
              active={activeStep === SetupCustomDomainStep.InputDomain}
              label='1. Domain'
              onClick={() => setActiveStep(SetupCustomDomainStep.InputDomain)}
            />
            <Tab active={activeStep === SetupCustomDomainStep.DnsRecords} disabled label='2. DNS' onClick={() => {}} />
          </Tabs>
          {/* Input domain step */}
          {activeStep === SetupCustomDomainStep.InputDomain && (
            <React.Fragment key='setup-custom-domain-input-domain-step'>
              <InputField
                error={!!errorMsg}
                errorMsg={errorMsg}
                onChange={handleDomainInputChange}
                onKeyPress={handleDomainInputKeyPress}
                placeholder='yourdomain.com'
                startAdornment={<Icons color='secondary' icon={Icon.At} />}
                value={domainName}
              />
              <NextButton loading={loading} onClick={() => void handleNextFromInputDomain()}>
                Next
              </NextButton>
            </React.Fragment>
          )}
          {/* DNS Records step */}
          {activeStep === SetupCustomDomainStep.DnsRecords && (
            <React.Fragment key='setup-custom-domain-dns-record-step'>
              <AddRecordsPrompt color='secondary' level={3} type='heading'>
                Add the following DNS records to your DNS provider. DNS records can take several hours to update.
              </AddRecordsPrompt>
              {dnsRecords?.map((record, index) => (
                <>
                  <DnsRecordRow dnsRecord={record} key={record.data} />
                  {index < dnsRecords.length - 1 ? <Divider /> : null}
                </>
              ))}
              <DnsRecordsButtonGroup>
                <ButtonGroupItem
                  key='setup-domain-confirm-button'
                  label='Confirm'
                  loading={loading}
                  onClick={() => void handleConfirm()}
                />
                <ButtonGroupItem
                  key='setup-domain-back-button'
                  label='Back'
                  onClick={() => setActiveStep(SetupCustomDomainStep.InputDomain)}
                />
              </DnsRecordsButtonGroup>
            </React.Fragment>
          )}
        </>
      )}
    </>
  );
};

export default SetupCustomDomain;
