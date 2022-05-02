export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const upperCaseFirstLetter = (s: string) => s && s[0].toUpperCase() + s.slice(1).toLowerCase();
