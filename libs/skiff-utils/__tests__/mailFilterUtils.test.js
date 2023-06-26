"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailFilterUtils_1 = require("../src/mailFilterUtils");
describe('isClientside', () => {
    it('should return true if filter contains clientside criteria', () => {
        expect((0, mailFilterUtils_1.isClientside)({
            filterType: 'SUBJECT',
            subFilter: []
        })).toBe(true);
        expect((0, mailFilterUtils_1.isClientside)({
            filterType: 'BODY',
            subFilter: []
        })).toBe(true);
        expect((0, mailFilterUtils_1.isClientside)({
            filterType: 'AND',
            subFilter: [
                {
                    filterType: 'SUBJECT',
                    subFilter: []
                },
                {
                    filterType: 'BODY',
                    subFilter: []
                }
            ]
        })).toBe(true);
    });
    it('should return false if the filter does not contain clientside criteria', () => {
        expect((0, mailFilterUtils_1.isClientside)({ filterType: 'TO', serializedData: 'test@test.com', subFilter: [] })).toBe(false);
        expect((0, mailFilterUtils_1.isClientside)({
            filterType: 'NOT',
            subFilter: [{ filterType: 'TO', serializedData: 'test@test.com', subFilter: [] }]
        })).toBe(false);
    });
});
//# sourceMappingURL=mailFilterUtils.test.js.map