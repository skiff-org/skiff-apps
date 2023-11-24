export type PgpKeyString = string | ArrayBuffer;

export interface ImportKeyOptions {
  email: string;
  key: PgpKeyString | null | undefined;
  ownKey: boolean;
  alreadyHasPgpKey: boolean;
  passphrase?: string | null;
  refetchPgpKey?: () => void;
}
