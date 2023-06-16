import { isENSName } from 'skiff-utils';

/**
 * Get Ethereum address from ENS name.
 * @param {string} ensName - ENS addr.
 * @returns {string | undefined} Ethereum address or undefined.
 */
export async function getEthAddrFromENSName(ensName: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const { ethereum } = window as any;

  if (!ethereum) return undefined;
  if (!isENSName(ensName)) return undefined;
  try {
    const { default: ethers } = await import('ethers');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const ens = new ethers.providers.Web3Provider(ethereum);
    const address = await ens.resolveName(ensName);
    if (!address) return undefined;
    return address;
  } catch (error) {
    console.error('Eth from ENS');
    console.error(error);
    return undefined;
  }
}
