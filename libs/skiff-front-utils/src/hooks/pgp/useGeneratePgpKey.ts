import { generatePGPKey, readPrivateKey } from "skiff-crypto-v2";
import { useSetPgpKeyMutation } from "skiff-front-graphql";
import { getPgpRequest } from "../../components/PgpKey/Pgp.utils";
import useToast from "../useToast";


export function useGeneratePgpKey(alreadyHasPgpKey: boolean, onClose?: () => void, hideToast?: boolean) {
  const { enqueueToast } = useToast();
  const [setPGPKey] = useSetPgpKeyMutation();

  const generateKey = async (_name: string | undefined, email: string, refetchPgpKey?: () => void) => {
    try {
      const keyData = await generatePGPKey([
        {
          name: undefined, // TODO: pass in name when BE fixed
          email
        }
      ]);
      const privateKey = await readPrivateKey(keyData.privateKey);
      const pgpRequest = await getPgpRequest(email, privateKey, alreadyHasPgpKey);

      await setPGPKey({
        variables: {
          request: pgpRequest
        }
      });
      if (!hideToast) {
        // Display success message to the user
        enqueueToast({
          title: 'PGP key generated',
          body: 'Your new PGP key has been successfully generated.'
        });
      }
      if (refetchPgpKey) refetchPgpKey();
    } catch (error) {
      console.log(error);
      if (!hideToast) {
        // Handle any errors that occur during the generation process
        enqueueToast({
          title: 'Error generating key',
          body: 'There was an error while generating your PGP key.'
        });
      }
    }
    onClose?.()
  }
  return { generateKey };
};
