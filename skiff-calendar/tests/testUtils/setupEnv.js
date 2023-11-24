const util = require('util');

const { TestEnvironment } = require('jest-environment-jsdom');

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
  }
};
