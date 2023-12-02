import protobufjs from 'protobufjs';
import { Range } from 'semver';

import { Datagram } from './aead/common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export const createProtoWrapperDatagramV2 = <Header, Body>(
  type: string,
  headerClass: { encode(input: Header, writer: protobufjs.Writer): protobufjs.Writer; decode(input: protobufjs.Reader, lenght?: number): Header },
  bodyClass: { encode(input: Body, writer: protobufjs.Writer): protobufjs.Writer; decode(input: protobufjs.Reader, lenght?: number): Body },
  version = '0.1.0',
  versionConstraint = new Range('0.1.*')
): Datagram<Header, Body> => ({
  versionConstraint,
  version,
  type,
  serializeHeader: (header: Header) => headerClass.encode(header, protobufjs.Writer.create()).finish(),
  deserializeHeader: (data: Uint8Array) => headerClass.decode(protobufjs.Reader.create(data)),
  serializeBody: (body: Body) => bodyClass.encode(body, protobufjs.Writer.create()).finish(),
  deserializeBody: (data: Uint8Array) => bodyClass.decode(protobufjs.Reader.create(data))
});
