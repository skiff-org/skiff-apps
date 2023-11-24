// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const util = require('util');

// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
const { TestEnvironment } = require('jest-environment-jsdom');
// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
const webstream = require('web-streams-polyfill');

// eslint-disable-next-line import/no-extraneous-dependencies

// A custom environment to set the TextEncoder that is required by mongodb.
module.exports = class CustomTestEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    this.global.Uint8Array = Uint8Array;
    if (typeof this.global.TextEncoder === 'undefined') {
      this.global.TextEncoder = util.TextEncoder;
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      this.global.TextDecoder = util.TextDecoder;
    }
    if (typeof this.global.ReadableStream === 'undefined') {
      this.global.ReadableStream = webstream.ReadableStream;
    }
    if (typeof this.global.crypto === 'undefined') {
      this.global.crypto = crypto;
    }
  }
};
