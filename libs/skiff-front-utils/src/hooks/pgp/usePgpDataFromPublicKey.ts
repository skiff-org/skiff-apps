import { useEffect, useState } from "react";
import { KeyAlgorithmInfo, PgpPublicKey } from "skiff-crypto-v2";

export function usePgpDataFromPublicKey(activePublicKey: PgpPublicKey | null) {
  const [activeAlgorithm, setActiveAlgorithm] = useState<KeyAlgorithmInfo | undefined>(undefined);
  const [activeExpires, setActiveExpires] = useState<number | Date | undefined>(undefined);
  const [activeCreation, setActiveCreation] = useState<number | Date | undefined>(undefined);
  const [activeFingerprint, setActiveFingerprint] = useState<string | undefined>(undefined);
  const getAlgorithm = async (publicKey: PgpPublicKey) => {
    const encryptionKey = await publicKey.getEncryptionKey();
    return encryptionKey.getAlgorithmInfo();
  };
  useEffect(() => {
    const populateData = async () => {
      if (!activePublicKey) return;
      const dataPromises = [
        getAlgorithm(activePublicKey),
        activePublicKey.getExpirationTime(),
        activePublicKey.getCreationTime(),
        activePublicKey.getFingerprint()
      ];
      const [algorithm, expiration, creationTime, fingerPrint] = await Promise.all(dataPromises);

      setActiveFingerprint(fingerPrint as string);
      setActiveCreation(creationTime as Date);
      if (expiration) setActiveExpires(expiration as number | Date);
      setActiveAlgorithm(algorithm as KeyAlgorithmInfo);
    };
    void populateData();
  }, [activePublicKey]);
  return { activeAlgorithm, activeExpires, activeCreation, activeFingerprint };
}
