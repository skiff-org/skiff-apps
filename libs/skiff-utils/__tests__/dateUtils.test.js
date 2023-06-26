"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
describe('dateToMonthAndOrdinalDay', () => {
    it('correctly fomrats date as month and ordinal day', () => {
        let date = new Date(2023, 3, 1); // April 1, 2023
        let formattedDate = (0, src_1.dateToMonthAndOrdinalDay)(date);
        expect(formattedDate).toBe('April 1st');
        date = new Date(2023, 3, 2); // April 2, 2023
        formattedDate = (0, src_1.dateToMonthAndOrdinalDay)(date);
        expect(formattedDate).toBe('April 2nd');
        date = new Date(2023, 3, 3); // April 3, 2023
        formattedDate = (0, src_1.dateToMonthAndOrdinalDay)(date);
        expect(formattedDate).toBe('April 3rd');
        date = new Date(2023, 3, 4); // April 4, 2023
        formattedDate = (0, src_1.dateToMonthAndOrdinalDay)(date);
        expect(formattedDate).toBe('April 4th');
        date = new Date(2025, 3, 17); // April 17, 2025
        formattedDate = (0, src_1.dateToMonthAndOrdinalDay)(date);
        expect(formattedDate).toBe('April 17th');
    });
});
//# sourceMappingURL=dateUtils.test.js.map