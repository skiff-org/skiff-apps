// eslint-disable-next-line max-classes-per-file
import randomBytes from 'randombytes';
import { Range } from 'semver';

import { createRawJSONDatagram } from '../datagramBuilders';

import { TaggedSecretBox } from './secretbox';

// 'ExampleData' is an toy implementation of a structured data object.
const ExampleDatagram = createRawJSONDatagram<any>('ddl://skiff/example');

describe('typed encryption/decryption', () => {
  const key = randomBytes(32);
  const envelope = new TaggedSecretBox(key);

  test('roundtrip', () => {
    const data = [1, 2, 3, 4, 5];

    const enc = envelope.encrypt(ExampleDatagram, data);

    expect(enc).not.toBeNull();

    const components = enc.inspect(); // NOTE: this isn't decryption
    expect(components).not.toBeNull();

    expect(components!.metadata.version).toEqual(ExampleDatagram.version);
    expect(components!.metadata.type).toEqual(ExampleDatagram.type);

    const dec = envelope.decrypt(ExampleDatagram, enc);
    expect(dec).not.toBeNull();

    expect(dec).toEqual(data);
  });

  test('versioned demo', () => {
    const FooV011Datagram = createRawJSONDatagram('Foo', '0.1.1', new Range('0.1.*'));
    const FooV012Datagram = createRawJSONDatagram('Foo', '0.1.2', new Range('0.1.*'));
    const FooV020Datagram = createRawJSONDatagram('Foo', '0.2.0', new Range('0.2.0'));

    // Serialize and encrypt some iterations of these objects.
    const f011 = [1, 2, [3]];
    const f012 = [1, 2, [3], 'four'];
    const f020 = [1, 2, [3], 'four', 'five'];

    const e011 = envelope.encrypt(FooV011Datagram, f011);
    const e012 = envelope.encrypt(FooV012Datagram, f012);
    const e020 = envelope.encrypt(FooV020Datagram, f020);

    // They get their object types correctly.
    const dec011 = envelope.decrypt(FooV011Datagram, e011);
    const dec012 = envelope.decrypt(FooV012Datagram, e012);
    const dec020 = envelope.decrypt(FooV020Datagram, e020);

    expect(dec011).toEqual(f011);
    expect(dec012).toEqual(f012);
    expect(dec020).toEqual(f020);

    // Different version cannot be decrypted with incompatible datagrams
    expect(() => envelope.decrypt(FooV011Datagram, e020)).toThrow();
    expect(() => envelope.decrypt(FooV020Datagram, e011)).toThrow();

    // Different version but with correct version constraint can be decrypted
    expect(envelope.decrypt(FooV011Datagram, e012)).toBeDefined();
    expect(envelope.decrypt(FooV012Datagram, e011)).toBeDefined();
  });
});
