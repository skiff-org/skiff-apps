"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClientside = void 0;
const nestingFilterCriteria = ['AND', 'OR', 'NOT'];
const clientsideFilterCriteria = ['SUBJECT', 'BODY'];
function isClientside(mailFilter) {
    if (nestingFilterCriteria.includes(mailFilter.filterType)) {
        return mailFilter.subFilter.some((f) => isClientside(f));
    }
    else {
        return clientsideFilterCriteria.includes(mailFilter.filterType);
    }
}
exports.isClientside = isClientside;
//# sourceMappingURL=mailFilterUtils.js.map