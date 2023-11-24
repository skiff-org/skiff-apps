/**
 * Various types of toasts used to introduce new features.
 * This is used to track the type of toast CTA clicks + impressions
 * in Mixpanel.
 */
export enum DiscoveryToastType {
  FreeCustomDomain = 'freeCustomDomain',
  NoiseCanceling = 'noiseCanceling',
  QuickAlias = 'quickAlias',
}
