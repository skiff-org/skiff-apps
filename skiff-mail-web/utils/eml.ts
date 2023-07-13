import axios from 'axios';
import { decryptDatagramV2 } from '@skiff-org/skiff-crypto';
import { RawMimeDatagram } from 'skiff-front-graphql';

export const getRawMime = async (encryptedRawMimeUrl: string, decryptedSessionKey: string) => {
  const resp = await axios.get(encryptedRawMimeUrl);

  if (!resp.data || typeof resp.data !== 'string') {
    return;
  }
  const data = resp.data;
  const { rawMime } = decryptDatagramV2(RawMimeDatagram, decryptedSessionKey, data).body;
  return rawMime;
};
