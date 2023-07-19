/* eslint-disable @typescript-eslint/naming-convention */
/* Opacities */
const opacities = {
  '--1': '0.01',
  '--2': '0.02',
  '--4': '0.04',
  '--6': '0.06',
  '--8': '0.08',
  '--10': '0.10',
  '--12': '0.12',
  '--14': '0.14',
  '--16': '0.16',
  '--20': '0.20',
  '--24': '0.24',
  '--26': '0.26',
  '--28': '0.28',
  '--32': '0.32',
  '--36': '0.36',
  '--42': '0.42',
  '--44': '0.44',
  '--48': '0.48',
  '--54': '0.54',
  '--56': '0.56',
  '--60': '0.60',
  '--64': '0.64',
  '--72': '0.72',
  '--80': '0.80',
  '--88': '0.88'
};

/* White & Black */
const grey_colors = {
  '--white': '255, 255, 255', // reference
  '--grey-100': '239, 239, 239',
  '--grey-200': '223, 223, 223',
  '--grey-300': '207, 207, 207',
  '--grey-400': '175, 175, 175',
  '--grey-500': '143, 143, 143',
  '--grey-600': '112, 112, 112',
  '--grey-700': '80, 80, 80', // reference
  '--grey-800': '48, 48, 48', // reference
  '--grey-900': '31, 31, 31',
  '--black': '0, 0, 0' // reference
};

/* Orange */
const orange_colors = {
  '--orange-100': '255, 235, 231',
  '--orange-200': '255, 215, 207',
  '--orange-300': '255, 195, 183',
  '--orange-400': '255, 142, 120', // reference
  '--orange-500': '239, 90, 60',
  '--orange-600': '199, 64, 37', // reference
  '--orange-700': '151, 41, 19',
  '--orange-800': '96, 16, 0'
};

/* Green */
const green_colors = {
  '--green-100': '191, 255, 229',
  '--green-200': '124, 247, 196',
  '--green-300': '72, 231, 165',
  '--green-400': '25, 199, 127', // reference
  '--green-500': '0, 160, 94', // reference
  '--green-600': '0, 128, 75',
  '--green-700': '0, 88, 51',
  '--green-800': '0, 56, 33'
};

/* Pink */
const pink_colors = {
  '--pink-100': '255, 239, 247',
  '--pink-200': '255, 215, 235',
  '--pink-300': '255, 191, 223',
  '--pink-400': '239, 149, 194', // reference
  '--pink-500': '175, 88, 131',
  '--pink-600': '175, 88, 131', // reference
  '--pink-700': '128, 56, 92',
  '--pink-800': '80, 30, 55'
};

/* Yellow */
const yellow_colors = {
  '--yellow-100': '255, 237, 183',
  '--yellow-200': '255, 223, 128',
  '--yellow-300': '255, 203, 48',
  '--yellow-400': '223, 171, 14', // reference
  '--yellow-500': '183, 137, 0',
  '--yellow-600': '143, 108, 0', // reference
  '--yellow-700': '104, 78, 0',
  '--yellow-800': '64, 48, 0'
};

/* Blue */
const blue_colors = {
  '--blue-100': '223, 244, 255',
  '--blue-200': '183, 231, 255',
  '--blue-300': '143, 218, 255',
  '--blue-400': '74, 183, 238', // reference
  '--blue-500': '39, 151, 207',
  '--blue-600': '11, 121, 175', // reference
  '--blue-700': '8, 88, 128',
  '--blue-800': '0, 53, 80'
};

/* Red */
const red_colors = {
  '--red-100': '255, 231, 231',
  '--red-200': '255, 215, 215',
  '--red-300': '255, 191, 191',
  '--red-400': '255, 143, 143', // reference
  '--red-500': '255, 80, 80',
  '--red-600': '215, 40, 40', // reference
  '--red-700': '159, 10, 10',
  '--red-800': '96, 0, 0'
};

/* Dark blue */
const dark_blue = {
  '--dark-blue-100': '231, 239, 255',
  '--dark-blue-200': '207, 223, 255',
  '--dark-blue-300': '183, 207, 255',
  '--dark-blue-400': '135, 175, 255', // reference
  '--dark-blue-500': '85, 139, 247',
  '--dark-blue-600': '43, 106, 231',
  '--dark-blue-700': '13, 72, 191', // reference
  '--dark-blue-800': '0, 40, 120'
};

const misc_colors = {
  '--primary-button-hover-shadow': '0 1px 0 rgba(27, 31, 35, 0.1)',
  '--primary-button-hover-inset-shadow': 'inset 0 1px 0 hsla(0, 0%, 100%, 0.03)',
  '--scrollbar-active-gray': '#cccdd0',
  '--scrollbar-inactive-gray': 'rgba(204, 205, 208, 0.5)',
  '--scrollbar-hover-gray': 'rgba(204, 205, 208, 0.7)',
  '--editor-text-pink': '#f78da7',
  '--card-box-shadow': 'rgba(0, 0, 0, 0.07) 0 0 32px 13px',
  '--filter-red-icon':
    'brightness(0) saturate(100%) invert(31%) sepia(99%) saturate(2878%) hue-rotate(332deg) brightness(96%) contrast(100%)',
  '--filter-green-icon':
    'brightness(0) saturate(100%) invert(50%) sepia(12%) saturate(2577%) hue-rotate(84deg) brightness(103%) contrast(85%)',
  '--filter-purple-icon':
    'brightness(0) saturate(100%) invert(35%) sepia(100%) saturate(5693%) hue-rotate(252deg) brightness(105%) contrast(101%)',
  '--filter-orange-icon':
    'brightness(0) saturate(100%) invert(77%) sepia(19%) saturate(7026%) hue-rotate(336deg) brightness(103%) contrast(101%)',
  '--filter-white-icon':
    'brightness(0) saturate(100%) invert(100%) sepia(4%) saturate(16%) hue-rotate(152deg) brightness(107%) contrast(103%)'
};

export const colors = {
  ...grey_colors,
  ...orange_colors,
  ...green_colors,
  ...pink_colors,
  ...yellow_colors,
  ...blue_colors,
  ...red_colors,
  ...dark_blue,
  ...misc_colors
};

export interface Theme {
  light: Record<string, string>;
  dark: Record<string, string>;
}

const theme = {
  light: {
    ...colors,
    /* text */
    /* text */
    '--text-primary': `rgb(143, 198, 65)`, // Homebrew green
    '--text-secondary': `rgba(143, 198, 65, 0.56)`,
    '--text-tertiary': `rgba(143, 198, 65, 0.44)`,
    '--text-disabled': `rgba(143, 198, 65, 0.32)`,
    '--text-always-white': `rgb(255, 255, 255)`,
    '--text-always-black': `rgb(0, 0, 0)`,
    '--text-link': `rgb(251, 198, 39)`, // Homebrew yellow
    '--text-destructive': `rgb(220, 30, 30)`, // Homebrew red
    '--text-inverse': `rgb(0, 0, 0)`, // black

    /* icon */
    '--icon-primary': `rgb(143, 198, 65)`, // Homebrew green
    '--icon-secondary': `rgba(143, 198, 65, 0.56)`,
    '--icon-tertiary': `rgba(143, 198, 65, 0.44)`,
    '--icon-disabled': `rgba(143, 198, 65, 0.32)`,
    '--icon-always-white': `rgb(255, 255, 255)`,
    '--icon-always-black': `rgb(0, 0, 0)`,
    '--icon-link': `rgb(251, 198, 39)`, // Homebrew yellow
    '--icon-destructive': `rgb(220, 30, 30)`, // Homebrew red
    '--icon-inverse': `rgb(0, 0, 0)`, // black

    /* cta */
    '--cta-primary-default': `rgb(143, 198, 65)`, // Homebrew green
    '--cta-primary-hover': `linear-gradient(0deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.16)), rgb(143, 198, 65)`,
    '--cta-primary-active': `linear-gradient(0deg, rgba(0, 0, 0, 0.24), rgba(0, 0, 0, 0.24)), rgb(143, 198, 65)`,
    '--cta-primary-disabled': `rgba(143, 198, 65, 0.12)`,

    '--cta-secondary-default': `rgb(144, 197, 65, 0.16)`, // Homebrew green with opacity
    '--cta-secondary-hover': `rgba(144, 197, 65, 0.06)`, // Homebrew green with opacity
    '--cta-secondary-active': `rgba(144, 197, 65, 0.08)`, // Homebrew green with opacity
    '--cta-secondary-disabled': 'transparent',

    '--cta-tertiary-default': `transparent`,
    '--cta-tertiary-hover': `rgba(143, 198, 65, 0.08)`,
    '--cta-tertiary-active': `rgba(143, 198, 65, 0.08)`,
    '--cta-tertiary-disabled': 'transparent',
    '--cta-destructive-default': 'transparent',
    '--cta-destructive-hover': `rgba(220, 30, 30, 0.08)`,
    '--cta-destructive-active': `rgba(220, 30, 30, 0.12)`,
    '--cta-chip-default': `transparent`,
    '--cta-chip-hover': `rgba(143, 198, 65, 0.06)`,
    '--cta-destructive-disabled': 'transparent',
    '--cta-navigation-default': 'transparent',
    '--cta-navigation-hover': `rgba(143, 198, 65, 0.06)`,
    '--cta-navigation-active': `rgba(143, 198, 65, 0.12)`,
    '--cta-navigation-disabled': 'transparent',

    /* border */
    '--border-primary': `rgba(143, 198, 65, 0.12)`, // Homebrew green
    '--border-secondary': `rgba(143, 198, 65, 0.08)`,
    '--border-tertiary': `rgba(143, 198, 65, 0.04)`,
    '--border-destructive': `rgba(220, 30, 30, 0.12)`, // Homebrew red
    '--border-inverse': `rgba(255, 255, 255, 0.42)`, // white
    '--border-disabled': `rgba(143, 198, 65, 0.02)`, // Homebrew green

    /* background */
    '--bg-main-container': `rgb(0, 0, 0)`, // pure black
    '--bg-sidepanel': `rgb(20, 20, 20)`, // very dark grey
    '--bg-l0-solid': `rgb(20, 20, 20)`,
    '--bg-l0-glass': `rgba(20, 20, 20, 0.72)`, // very dark grey, varying opacities
    '--bg-l1-solid': `rgb(40, 40, 40)`, // dark grey
    '--bg-l1-glass': `rgba(40, 40, 40, 0.72)`,
    '--bg-l2-solid': `rgb(60, 60, 60)`, // medium dark grey
    '--bg-l2-glass': `rgba(60, 60, 60, 0.72)`,
    '--bg-l3-solid': `rgb(39 62 16)`, // green
    '--bg-l3-glass': `rgba(80, 80, 80, 0.72)`,
    '--bg-emphasis': `linear-gradient(0deg, rgba(143, 198, 65, 0.16), rgba(143, 198, 65, 0.16)), rgb(0, 0, 0)`, // emphasis with Homebrew green
    '--bg-scrim': `rgba(143, 198, 65, 0.8)`, // heavy Homebrew green
    '--bg-cell-hover': `rgb(10, 10, 10)`, // very very dark grey
    '--bg-cell-active': `rgb(20, 20, 20)`,
    '--bg-field-default': `rgb(10, 10, 10)`,
    '--bg-field-hover': `rgb(20, 20, 20)`,

    // overlay
    '--bg-overlay-primary': `rgba(143, 198, 65, 0.1)`, // Homebrew green with opacity
    '--bg-overlay-secondary': `rgba(143, 198, 65, 0.08)`,
    '--bg-overlay-tertiary': `rgba(143, 198, 65, 0.06)`,
    '--bg-overlay-quaternary': `rgba(143, 198, 65, 0.04)`,
    '--bg-overlay-destructive': `rgba(220, 30, 30, 0.24)`, // Homebrew red

    /* shadows - TODO: Remove */
    '--editor-page-shadow': '60 64 67 / 15%) 0 1px 3px 1px',
    '--tab-active-shadow': '0 123 255 / 25%',
    '--shadow-l1': '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 0px 2px rgba(0, 0, 0, 0.06)',
    '--shadow-l2': '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '--shadow-l3': '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '--inset-empty': 'inset 1px 1px 0px rgba(0, 0, 0, 0.1)',
    '--icon-bevel': 'inset 0px -3px 0px 1px rgba(0, 0, 0, 0.1), inset 0px 1px 0px 1px rgba(255, 255, 255, 0.5)',
    '--secondary-button-border': 'inset 0px 1px 0px rgba(0, 0, 0, 0.1), inset 0px -1px 0px 1px rgba(0, 0, 0, 0.1)',
    '--destructive-button-border':
      'inset 0px -1px 0px 1px rgba(215, 40, 40, 0.2), inset 0px 1px 0px rgba(215, 40, 40, 0.2)',
    '--skiff-dropdown-shadow': 'rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 2px 0 inset',
    '--skiff-font-size-shadow': 'rgba(225, 228, 232, 0.2) 0 2px 0 inset',
    '--skiff-drawer-shadow': '0px 0px 40px rgba(0, 0, 0, 0.1)',

    /* filters - TODO: remove (Icons refactor) */
    '--filter-dark-card-bg': 'none',
    '--filter-dark-lock-icon': 'none',
    '--filter-dark-icon': 'none',
    '--filter-white-icon-dark': 'none',
    '--skiff-table-menu-input': '#1b27334d',
    '--skiff-header-hover': 'rgba(55, 53, 47, 0.12)',
    '--skiff-header-active': 'rgba(55, 53, 47, 0.16)',

    /* code mark */
    '--skiff-code-mark-color': `rgb(251, 198, 39)`, // Homebrew yellow
    '--skiff-code-mark-bg': `rgba(0, 0, 0, 0.06)`,

    /* thread item */
    '--bg-cell-unread': `rgb(255, 255, 255)`, // white
    '--status-bar-color': `linear-gradient(0deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02)), rgb(255, 255, 255)`,
    '--illustration-fill': `rgb(225, 228, 232)`,
    '--bg-skiff-loader': `rgb(143, 198, 65)` // Homebrew green
  },
  dark: {
    ...colors,
    /* text */
    '--text-primary': `rgb(${colors['--white']})`,
    '--text-secondary': `rgba(${colors['--white']}, ${opacities['--54']})`,
    '--text-tertiary': `rgba(${colors['--white']}, ${opacities['--42']})`,
    '--text-disabled': `rgba(${colors['--white']}, ${opacities['--28']})`,
    '--text-always-white': `rgb(${colors['--white']})`,
    '--text-always-black': `rgb(${colors['--black']})`,
    '--text-link': `rgb(${colors['--orange-400']})`,
    '--text-destructive': `rgb(${colors['--red-400']})`,
    '--text-inverse': `rgb(${colors['--black']})`,
    /* icon */
    '--icon-primary': `rgb(${colors['--white']})`,
    '--icon-secondary': `rgba(${colors['--white']}, ${opacities['--54']})`,
    '--icon-tertiary': `rgba(${colors['--white']}, ${opacities['--42']})`,
    '--icon-disabled': `rgba(${colors['--white']}, ${opacities['--28']})`,
    '--icon-always-white': `rgb(${colors['--white']})`,
    '--icon-always-black': `rgb(${colors['--black']})`,
    '--icon-link': `rgb(${colors['--orange-400']})`,
    '--icon-destructive': `rgb(${colors['--red-400']})`,
    '--icon-inverse': `rgb(${colors['--black']})`,
    /* cta */
    '--cta-primary-default': `rgb(${colors['--white']})`,
    '--cta-primary-hover': `linear-gradient(0deg, rgba(${colors['--black']}, ${opacities['--8']}), rgba(${colors['--black']}, ${opacities['--8']})), rgb(${colors['--white']})`,
    '--cta-primary-active': `linear-gradient(0deg, rgba(${colors['--black']}, ${opacities['--12']}), rgba(${colors['--black']}, ${opacities['--12']})), rgb(${colors['--white']})`,
    '--cta-primary-disabled': `rgba(${colors['--white']}, ${opacities['--12']})`,

    '--cta-secondary-default': `rgb(255, 255, 255)`, // white
    '--cta-secondary-hover': `rgba(144, 197, 65, 0.06)`, // Homebrew green with opacity
    '--cta-secondary-active': `rgba(144, 197, 65, 0.08)`, // Homebrew green with opacity
    '--cta-secondary-disabled': 'transparent',

    '--cta-tertiary-default': `transparent`,
    '--cta-tertiary-hover': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--cta-tertiary-active': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--cta-tertiary-disabled': 'transparent',

    '--cta-destructive-default': `rgba(${colors['--white']}, ${opacities['--4']})`,
    '--cta-destructive-hover': `rgba(${colors['--red-400']}, ${opacities['--12']})`,
    '--cta-destructive-active': `rgba(${colors['--red-400']}, ${opacities['--12']})`,
    '--cta-destructive-disabled': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--14']}), rgba(${colors['--white']}, ${opacities['--14']})), rgb(${colors['--black']})`,

    '--cta-chip-default': `transparent`,
    '--cta-chip-hover': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--cta-navigation-default': 'transparent',
    '--cta-navigation-hover': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--cta-navigation-active': `rgba(${colors['--white']}, ${opacities['--12']})`,
    '--cta-navigation-disabled': 'transparent',
    /* border */
    '--border-primary': `rgba(${colors['--white']}, ${opacities['--12']})`,
    '--border-secondary': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--border-tertiary': `rgba(${colors['--white']}, ${opacities['--4']})`,
    '--border-hover': `rgba(${colors['--white']}, ${opacities['--48']})`,
    '--border-active': `rgb(${colors['--white']})`,
    '--border-destructive': `rgba(${colors['--red-400']},${opacities['--12']})`,
    /* background */
    '--bg-main-container': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--12']}), rgba(${colors['--white']}, ${opacities['--12']})), rgb(${colors['--black']})`,
    '--bg-sidepanel': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--10']}), rgba(${colors['--white']}, ${opacities['--10']})), rgb(${colors['--black']})`,
    '--bg-l0-solid': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--8']}), rgba(${colors['--white']}, ${opacities['--8']})), rgb(${colors['--black']})`,
    '--bg-l0-glass': `rgba(10, 10, 10, ${opacities['--72']})`,
    '--bg-l1-solid': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--10']}), rgba(${colors['--white']}, ${opacities['--10']})), rgb(${colors['--black']})`,
    '--bg-l1-glass': `rgba(20, 20, 20, ${opacities['--72']})`,
    '--bg-l2-solid': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--12']}), rgba(${colors['--white']}, ${opacities['--12']})), rgb(${colors['--black']})`,
    '--bg-l2-glass': `rgba(31, 31, 31, ${opacities['--72']})`,
    '--bg-l3-solid': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--14']}), rgba(${colors['--white']}, ${opacities['--14']})), rgb(${colors['--black']})`,
    '--bg-l3-glass': `rgba(41, 41, 41, ${opacities['--72']})`,
    '--bg-emphasis': `rgb(${colors['--grey-800']})`,
    '--bg-scrim': `rgba(${colors['--black']}, ${opacities['--42']})`,
    '--bg-cell-hover': `rgba(${colors['--white']}, ${opacities['--6']})`,
    '--bg-cell-active': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--bg-field-default': `rgba(${colors['--white']}, ${opacities['--8']})`,
    '--bg-field-hover': `rgba(${colors['--white']}, ${opacities['--12']})`,
    // overlay
    '--bg-overlay-primary': `rgba(143, 198, 65, 0.1)`, // Homebrew green with opacity
    '--bg-overlay-secondary': `rgba(143, 198, 65, 0.08)`,
    '--bg-overlay-tertiary': `rgba(143, 198, 65, 0.06)`,
    '--bg-overlay-quaternary': `rgba(143, 198, 65, 0.04)`,
    '--bg-overlay-destructive': `rgba(220, 30, 30, 0.24)`, // Homebrew red
    /* accent */
    '--accent-orange-primary': `rgba(${colors['--orange-400']}, ${opacities['--88']})`,
    '--accent-orange-secondary': `rgba(${colors['--orange-400']}, ${opacities['--36']})`,
    '--accent-green-primary': `rgba(${colors['--green-400']}, ${opacities['--88']})`,
    '--accent-green-secondary': `rgba(${colors['--green-400']}, ${opacities['--32']})`,
    '--accent-pink-primary': `rgba(${colors['--pink-400']}, ${opacities['--88']})`,
    '--accent-pink-secondary': `rgba(${colors['--pink-400']}, ${opacities['--36']})`,
    '--accent-yellow-primary': `rgba(${colors['--yellow-400']}, ${opacities['--88']})`,
    '--accent-yellow-secondary': `rgba(${colors['--yellow-400']}, ${opacities['--36']})`,
    '--accent-blue-primary': `rgba(${colors['--blue-400']}, ${opacities['--88']})`,
    '--accent-blue-secondary': `rgba(${colors['--blue-400']}, ${opacities['--36']})`,
    '--accent-red-primary': `rgba(${colors['--red-400']}, ${opacities['--88']})`,
    '--accent-red-secondary': `rgba(${colors['--red-400']}, ${opacities['--36']})`,
    '--accent-dark-blue-primary': `rgba(${colors['--dark-blue-400']}, ${opacities['--88']})`,
    '--accent-dark-blue-secondary': `rgba(${colors['--dark-blue-400']}, ${opacities['--36']})`,
    /* shadows - TODO: Remove */
    '--editor-page-shadow': '60 64 67 / 15%) 0 1px 3px 1px',
    '--tab-active-shadow': '0 123 255 / 25%',
    '--shadow-l1': '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 1px 2px rgba(0, 0, 0, 0.26)',
    '--shadow-l2': '0px 10px 15px -3px rgba(0, 0, 0, 0.3), 0px 4px 6px -2px rgba(0, 0, 0, 0.25)',
    '--shadow-l3': '0px 25px 50px -12px rgba(0, 0, 0, 0.55)',
    '--inset-empty': 'inset 0px -1px 0px rgba(255, 255, 255, 0.1)',
    '--icon-bevel': 'inset 0px -3px 0px 1px rgba(0, 0, 0, 0.1), inset 0px 1px 0px 1px rgba(255, 255, 255, 0.5)',
    '--secondary-button-border':
      'inset 0px 1px 0px rgb(255 255 255 / 20%), inset 0px -1px 0px 1px hsl(0deg 0% 100% / 20%)',
    '--destructive-button-border':
      'inset 0px -1px 0px 1px rgba(255, 143, 143, 0.12), inset 0px 1px 0px rgba(255, 143, 143, 0.12)',
    '--skiff-dropdown-shadow': 'rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 2px 0 inset',
    '--skiff-font-size-shadow': 'rgba(225, 228, 232, 0.2) 0 2px 0 inset',
    '--skiff-drawer-shadow': '0px 0px 40px rgba(0, 0, 0, 0.1)',
    /* filters - TODO: remove (Icons refactor) */
    '--filter-dark-card-bg': 'none',
    '--filter-dark-icon': 'none',
    '--filter-white-icon-dark': 'none',
    '--skiff-table-menu-input': '#1b27334d',
    '--skiff-header-hover': 'rgba(55, 53, 47, 0.12)',
    '--skiff-header-active': 'rgba(55, 53, 47, 0.16)',
    /* code mark */
    '--skiff-code-mark-color': `rgb(${colors['--orange-400']})`,
    '--skiff-code-mark-bg': `rgba(${colors['--black']}, ${opacities['--6']})`,
    /* thread item */
    '--bg-cell-unread': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--14']}), rgba(${colors['--white']}, ${opacities['--14']})), rgb(${colors['--black']})`,
    '--status-bar-color': `linear-gradient(0deg, rgba(${colors['--white']}, ${opacities['--12']}), rgba(${colors['--white']}, ${opacities['--12']})), rgb(${colors['--black']})`,
    '--illustration-fill': `rgb(${colors['--grey-800']})`,
    '--bg-skiff-loader': `rgb(${colors['--blue-500']})`
  }
} as const;

export const themeNames: Theme & typeof theme = theme;
