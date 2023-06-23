import { themeNames } from '@skiff-org/skiff-ui';

export const linkStyling = `
    color: var(--text-link, ${themeNames.light['--text-link']});
    background: var(--transparent-background);
    cursor: pointer;
    text-decoration: none;
`;

export const orderedListStyling = (listType = '') => `
    padding-left: 30px;
    ${listType ? `list-style-type: ${listType};` : listType}
`;
export const bulletListStyling = `padding-left: 30px;`;

export const strikethroughStyling = `
    color: var(--text-primary, ${themeNames.light['--text-primary']});
`;

export const listItemStyling = 'margin-left: 0px;';

export const imgStyling = `
    max-width: calc(100% - 15px);
    border: solid 1px transparent;
    margin: 0px 5px;
    display: inline-block;
`;
