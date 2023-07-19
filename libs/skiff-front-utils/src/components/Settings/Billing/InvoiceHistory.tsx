import { Icon, Icons, IconText, MonoTag, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import dayjs from 'dayjs';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { isMobile } from 'react-device-detect';
import { useInvoiceHistory } from 'skiff-front-graphql';
import styled, { css } from 'styled-components';
import EmptyInvoice from '../../EmptyInvoice/EmptyInvoice';

const Header = styled.thead`
  border-bottom: 1px solid var(--border-tertiary) !important;
  text-align: left;
`;

const Table = styled.table`
  overflow: hidden;
  display: table;
  margin: 0px auto;
  border-spacing: 0px;
  border-collapse: collapse;
  width: 100%;
  text-align: left;
  * {
    outline: 0px;
    box-sizing: border-box;
  }
`;

const StyledTh = styled.th<{ $collapse?: boolean }>`
  white-space: nowrap;
  padding: 4px 0px;
  padding-left: 0px;
  ${({ $collapse }) =>
    $collapse &&
    css`
      width: 0px;
    `}
  ${({ $collapse }) =>
    !$collapse &&
    css`
      width: fit-content;
      min-width: 1px;
    `}
`;

const StyledTr = styled.tr`
  line-height: 1;
  border-bottom: 1px solid var(--border-tertiary);
`;

const StyledTd = styled.td`
  white-space: nowrap;
  padding-top: 16px;
  padding-bottom: 16px;
`;

const TierContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const headers = isMobile
  ? ['Date', 'Amount paid', 'Invoice detail']
  : ['Date', 'Amount paid', 'Invoice detail', 'Status', '']; // empty string for the external button column

enum InvoiceStates {
  Draft = 'draft',
  Open = 'open',
  Paid = 'paid',
  Void = 'void',
  Uncollectible = 'uncollectible'
}

const getStatusText = (status: InvoiceStates) => {
  switch (status) {
    case InvoiceStates.Draft:
      return 'Started';
    case InvoiceStates.Open:
      return 'Awaiting payment';
    case InvoiceStates.Paid:
      return 'Paid';
    case InvoiceStates.Void:
      return 'Canceled';
    case InvoiceStates.Uncollectible:
      return 'Failed';
    default:
      return status;
  }
};

const getStatusColor = (status: InvoiceStates) => {
  switch (status) {
    case InvoiceStates.Draft:
    case InvoiceStates.Open:
      return 'disabled';
    case InvoiceStates.Void:
    case InvoiceStates.Uncollectible:
      return 'red';
    case InvoiceStates.Paid:
    default:
      return 'green';
  }
};

function InvoiceHistory() {
  const {
    data: { invoiceHistory },
    loading: invoiceHistoryLoading
  } = useInvoiceHistory();

  const featureFlags = useFlags();
  const showAllInvoices = featureFlags.showAllInvoices as boolean;
  const invoiceAlerts = invoiceHistory?.filter((invoice) => showAllInvoices || invoice?.status !== InvoiceStates.Paid);

  const hasInvoice = !!invoiceAlerts && invoiceAlerts?.length > 0;
  return (
    <>
      {!isMobile && (
        <Typography mono uppercase size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
          Invoice alerts
        </Typography>
      )}
      <Table>
        <Header>
          <tr>
            {headers.map((header, index) => {
              return (
                <StyledTh $collapse={!isMobile && index === headers.length - 1}>
                  <Typography uppercase mono color='disabled' size={TypographySize.CAPTION}>
                    {header}
                  </Typography>
                </StyledTh>
              );
            })}
          </tr>
        </Header>
        {hasInvoice &&
          invoiceAlerts.map((invoice) => {
            const { amountDue, created, invoiceTiers, url, status } = invoice || {};
            const statusLabel = getStatusText((status || '') as InvoiceStates);
            const statusColor = getStatusColor((status || '') as InvoiceStates);

            return (
              <tbody>
                <StyledTr>
                  <StyledTd>
                    <Typography mono uppercase>
                      {dayjs(created).format('MMM DD, YYYY')}
                    </Typography>
                  </StyledTd>
                  {!(amountDue === null || amountDue === undefined) && (
                    <StyledTd>
                      <Typography mono uppercase>{`$${(amountDue / 100).toFixed(2)}`}</Typography>
                    </StyledTd>
                  )}
                  <StyledTd>
                    <TierContainer>
                      {invoiceTiers?.map((tier, index) => {
                        const lastTier = index === invoiceTiers.length - 1;
                        return (
                          <>
                            <Typography mono uppercase>
                              {tier}
                            </Typography>
                            {!lastTier && <Icons color='disabled' icon={Icon.ArrowRight} />}
                          </>
                        );
                      })}
                    </TierContainer>
                  </StyledTd>
                  {!isMobile && (
                    <>
                      <StyledTd>
                        <MonoTag color={statusColor} label={statusLabel} />
                      </StyledTd>
                      <StyledTd>
                        {!!url && (
                          <IconText
                            color='secondary'
                            onClick={() => {
                              if (typeof window === undefined) return;
                              window.open(url, '_blank', 'noopener noreferrer');
                            }}
                            startIcon={Icon.ExternalLink}
                            tooltip='View details'
                          />
                        )}
                      </StyledTd>
                    </>
                  )}
                </StyledTr>
              </tbody>
            );
          })}
      </Table>
      {!hasInvoice && !invoiceHistoryLoading && (
        <EmptyInvoice title='No invoice alerts' subtitle='Any transaction updates will appear here' />
      )}
    </>
  );
}

export default InvoiceHistory;
