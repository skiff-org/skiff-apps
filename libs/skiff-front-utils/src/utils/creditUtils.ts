import { CreditInfo, CreditInfoResponse } from 'skiff-graphql';

/**
 * The getCreditsQuery returns an array of CreditInfoResponse, which hold the credit earned info for various credit info types
 * This function helps us extract the credit cents (rather than storage credits) for a given credit info type.
 * It can return undefined if the type is not found in the given array.
 */
export const getCreditCentsForInfoType = (
  totalCreditInfo: CreditInfoResponse[],
  creditInfoType: CreditInfo
): number | undefined => totalCreditInfo.find((credit) => credit.info == creditInfoType)?.amount.cents;
