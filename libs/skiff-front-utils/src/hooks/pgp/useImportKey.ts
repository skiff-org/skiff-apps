import { readArmoredPrivateKey, readArmoredPublicKey } from "skiff-crypto-v2";
import { useSetPgpKeyMutation } from "skiff-front-graphql";
import { assertExists } from "skiff-utils";
import { ImportKeyOptions } from "../../components/PgpKey/Pgp.types";
import { getPgpRequest } from "../../components/PgpKey/Pgp.utils";
import useToast from "../useToast";


export function useImportKey() {
  const [setPGPKey] = useSetPgpKeyMutation();
  const { enqueueToast } = useToast();


  const importKey = async ({ email, key, ownKey, alreadyHasPgpKey, passphrase, refetchPgpKey }: ImportKeyOptions) => {
    try {
      assertExists(key);
      if (!ownKey) { // can only import public key if its a contact
        try {
          const publicKey = await readArmoredPublicKey(key.toString());
          if (publicKey.isPrivate()) {
            enqueueToast({
              title: 'Error importing key',
              body: 'You cannot import a private key.'
            });
          }
        } catch (error) {
          console.log(error);
          enqueueToast({
            title: 'Error importing key',
            body: 'There was an error while importing your PGP key.'
          });
        }
        return;
      }
      // can only import private key if its your own address
      const privateKey = await readArmoredPrivateKey(key.toString(), passphrase);
      const pgpRequest = await getPgpRequest(email, privateKey, alreadyHasPgpKey);

      await setPGPKey({
        variables: {
          request: pgpRequest
        }
      });
      if (refetchPgpKey) refetchPgpKey();

      enqueueToast({
        title: 'PGP key imported',
        body: 'Your new PGP key has been successfully imported.'
      });
    } catch (error) {
      console.log(error);
      // Handle any errors that occur during the generation process
      enqueueToast({
        title: 'Error importing key',
        body: 'There was an error while importing your PGP key.'
      });
    }
  }
  return { importKey };
}
