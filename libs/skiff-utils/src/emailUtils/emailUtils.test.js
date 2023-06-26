"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailUtils_1 = require("./emailUtils");
describe('getCategorizedAliases', () => {
    //test env uses skiff.town EMAIL_DOMAIN
    it('correctly categorizes aliases when custom domains included', () => {
        const aliases = [
            'short@skiff.town',
            'shor@skiff.town',
            'short@customdomain.town',
            '1234@notskiff.town',
            'longalias@skiff.town',
            'longalias@customdomain.town',
            'alias@ud.me'
        ];
        const { shortGenericSkiffAliases, nonCryptoAliases, genericSkiffAliases, cryptoAliases } = (0, emailUtils_1.getCategorizedAliases)(aliases);
        expect(shortGenericSkiffAliases.length).toBe(2);
        expect(nonCryptoAliases.length).toBe(6);
        expect(genericSkiffAliases.length).toBe(3);
        expect(cryptoAliases.length).toBe(1);
    });
    it('correctly categorizes aliases when no short Skiff aliases present', () => {
        const aliases = ['notshort@skiff.town', 'notshort@customdomain.town', 'longalias@skiff.town', 'a.eth'];
        const { shortGenericSkiffAliases, nonCryptoAliases, genericSkiffAliases, cryptoAliases } = (0, emailUtils_1.getCategorizedAliases)(aliases);
        expect(shortGenericSkiffAliases.length).toBe(0);
        expect(nonCryptoAliases.length).toBe(3);
        expect(genericSkiffAliases.length).toBe(2);
        expect(cryptoAliases.length).toBe(1);
    });
    it('correctly categorizes aliases when only custom domains and wallet addresses present', () => {
        const aliases = ['1234@notskiff.town', '2345@notskiff.town', '3456@notskiff.town', 'abc.eth', 'xyz.eth'];
        const { shortGenericSkiffAliases, nonCryptoAliases, genericSkiffAliases, cryptoAliases } = (0, emailUtils_1.getCategorizedAliases)(aliases);
        expect(shortGenericSkiffAliases.length).toBe(0);
        expect(nonCryptoAliases.length).toBe(3);
        expect(genericSkiffAliases.length).toBe(0);
        expect(cryptoAliases.length).toBe(2);
    });
    it('correctly categorizes aliases when only generic skiff aliases present', () => {
        const aliases = [
            'xxxx@skiff.town',
            'longalias@skiff.town',
            'anotherlongalias@skiff.town',
            'somealias@skiff.town',
            'someotheralias@skiff.town'
        ];
        const { shortGenericSkiffAliases, nonCryptoAliases, genericSkiffAliases, cryptoAliases } = (0, emailUtils_1.getCategorizedAliases)(aliases);
        expect(shortGenericSkiffAliases.length).toBe(1);
        expect(nonCryptoAliases.length).toBe(5);
        expect(genericSkiffAliases.length).toBe(5);
        expect(cryptoAliases.length).toBe(0);
    });
});
//# sourceMappingURL=emailUtils.test.js.map