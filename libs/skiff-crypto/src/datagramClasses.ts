import { Reader, Writer } from 'protobufjs';
import { Range } from 'semver';

import { DatagramV2 } from './aead-v2/common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export const createProtoWrapperDatagramV2 = <Header, Body>(
  type: string,
  headerClass: { encode(input: Header, writer: Writer): Writer; decode(input: Reader, lenght?: number): Header },
  bodyClass: { encode(input: Body, writer: Writer): Writer; decode(input: Reader, lenght?: number): Body },
  version = '0.1.0',
  versionConstraint = new Range('0.1.*')
): DatagramV2<Header, Body> => ({
  versionConstraint,
  version,
  type,
  serializeHeader: (header: Header) => headerClass.encode(header, Writer.create()).finish(),
  deserializeHeader: (data: Uint8Array) => headerClass.decode(Reader.create(data)),
  serializeBody: (body: Body) => bodyClass.encode(body, Writer.create()).finish(),
  deserializeBody: (data: Uint8Array) => bodyClass.decode(Reader.create(data))
});
