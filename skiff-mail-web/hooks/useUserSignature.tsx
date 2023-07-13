import { decryptSymmetric, stringDecryptAsymmetric } from '@skiff-org/skiff-crypto';
import { useGetUserSignatureQuery, UserSignatureDatagram } from 'skiff-front-graphql';
import { useRequiredCurrentUserData } from 'skiff-front-utils';

export function useUserSignature() {
  const { data } = useGetUserSignatureQuery();
  const user = useRequiredCurrentUserData();
  const privateKey = user.privateUserData.privateKey;
  const sessionKey = data?.userSignature?.sessionKey;
  const userSignature = data?.userSignature?.userSignature;
  if (!!sessionKey && !!userSignature) {
    const encryptedBy = sessionKey.encryptedBy as { key: string };
    const encryptedSessionKey = sessionKey.encryptedSessionKey;
    const decryptedSessionKey = stringDecryptAsymmetric(privateKey, encryptedBy, encryptedSessionKey);
    return decryptSymmetric(userSignature?.encryptedData, decryptedSessionKey, UserSignatureDatagram);
  }
}
