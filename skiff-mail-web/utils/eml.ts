import axios from 'axios';
import { decryptDatagram } from 'skiff-crypto-v2';
import { RawMimeDatagram } from 'skiff-front-graphql';

export const getRawMime = async (encryptedRawMimeUrl: string, decryptedSessionKey: string) => {
  const resp = await axios.get(encryptedRawMimeUrl);

  if (!resp.data || typeof resp.data !== 'string') {
    return;
  }
  const data = resp.data;
  const { rawMime } = decryptDatagram(RawMimeDatagram, decryptedSessionKey, data).body;
  return rawMime;
};
