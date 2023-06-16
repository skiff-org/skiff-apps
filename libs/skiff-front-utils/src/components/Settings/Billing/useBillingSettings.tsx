import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { insertIf } from 'skiff-utils';
import { useRequiredCurrentUserData } from '../../../apollo/localState/currentUser';
import { isMobileApp } from '../../../utils/mobileUtils';
import { SETTINGS_LABELS, Setting, SettingType, SettingValue } from '../Settings.types';
import CurrentSubscriptions from './CurrentSubscriptions/CurrentSubscriptions';
import InvoiceHistory from './InvoiceHistory';
import PaymentDetails from './PaymentDetails';

export const useBillingSettings: (openPlansPage: () => void) => Setting[] = (openPlansPage: () => void) => {
  const { userID } = useRequiredCurrentUserData();
  const featureFlags = useFlags();
  const showAllInvoices = featureFlags.showAllInvoices as boolean;
  const settings: Array<Setting> = useMemo(() => {
    return [
      {
        type: SettingType.Custom,
        value: SettingValue.CurrentSubscriptions,
        component: <CurrentSubscriptions openPlansPage={openPlansPage} />,
        label: SETTINGS_LABELS[SettingValue.CurrentSubscriptions],
        icon: Icon.Cart, // should never appear on mobile
        color: 'orange'
      },
      ...insertIf<Setting>(!isMobile, {
        type: SettingType.Custom,
        value: SettingValue.PaymentDetails,
        component: <PaymentDetails />,
        label: SETTINGS_LABELS[SettingValue.PaymentDetails],
        icon: Icon.Currency,
        color: 'green'
      }),
      ...insertIf<Setting>(showAllInvoices, {
        type: SettingType.Custom,
        value: SettingValue.InvoiceHistory,
        component: <InvoiceHistory />,
        label: SETTINGS_LABELS[SettingValue.InvoiceHistory],
        icon: Icon.History,
        color: 'blue'
      })
    ];
  }, [userID]);

  if (isMobileApp()) return [];

  return settings;
};
