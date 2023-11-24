const ANIMAL_TAGS = [
  'bull',
  'ox',
  'titan',
  'lion',
  'eagle',
  'wolf',
  'snake',
  'dragon',
  'tiger',
  'owl',
  'shark',
  'spider',
  'hawk',
  'bear',
  'panther',
  'falcon',
  'scorpion',
  'stingray',
  'bat',
  'raven',
  'jaguar',
  'rhino',
  'gorilla',
  'leopard',
  'fox',
  'cobra'
];

const STEALTH_TAGS = [
  'shadow',
  'ghost',
  'ninja',
  'sneak',
  'veil',
  'whisk',
  'slip',
  'cloak',
  'mute',
  'lynx',
  'mist',
  'whiff',
  'veer',
  'haze'
];

const WEAPON_TAGS = [
  'sword',
  'bow',
  'spear',
  'axe',
  'dagger',
  'shield',
  'whip',
  'mace',
  'arrow',
  'hammer',
  'sling',
  'crossbow',
  'javelin',
  'saber',
  'rapier',
  'flail'
];

const SECURE_PLACE_TAGS = [
  'fort',
  'cave',
  'vault',
  'safe',
  'bunker',
  'haven',
  'lock',
  'tent',
  'castle',
  'fortress',
  'citadel',
  'keep',
  'tower',
  'palace',
  'base',
  'camp',
  'station',
  'tower'
];

const ELEMENT_TAGS = [
  'fire',
  'water',
  'earth',
  'air',
  'light',
  'dark',
  'ice',
  'metal',
  'wood',
  'sea',
  'forest',
  'jungle',
  'cave',
  'volcano',
  'magma',
  'smoke',
  'vapor',
  'dust',
  'island',
  'beach',
  'river',
  'lake',
  'pond',
  'glacier',
  'canyon',
  'valley',
  'cliff',
  'hill',
  'mountain',
  'peak',
  'grassland',
  'desert',
  'tundra',
  'taiga',
  'rain',
  'snow',
  'wind',
  'cloud',
  'storm',
  'fog',
  'light',
  'iron',
  'steel',
  'silver',
  'bronze',
  'copper',
  'platinum',
  'pearl',
  'ruby',
  'sapphire',
  'emerald',
  'diamond',
  'amber',
  'topaz',
  'turquoise',
  'ivory',
  'obsidian',
  'onyx',
  'opal',
  'quartz',
  'jade',
  'jasper',
  'lapis'
];

const PRIVACY_TAGS = [
  'secret',
  'private',
  'hidden',
  'secure',
  'key',
  'lock',
  'gate',
  'shield',
  'mask',
  'cloak',
  'stealth',
  'guard',
  'sentry'
];

const COLOR_TAGS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'brown',
  'black',
  'white',
  'crimson',
  'coral',
  'gold',
  'lime',
  'teal',
  'indigo',
  'maroon',
  'olive',
  'navy'
];

const QUIET_TAGS = ['quiet', 'silent', 'whisper', 'hush', 'mute', 'hush'];

const CELESTIAL_TIME_TAGS = [
  'day',
  'night',
  'dawn',
  'dusk',
  'noon',
  'midnight',
  'eve',
  'evening',
  'twilight',
  'sunrise',
  'sunset',
  'sun',
  'moon',
  'star',
  'comet',
  'meteor'
];

interface Tags {
  stealthTags: string[];
  animalTags: string[];
  weaponTags: string[];
  secureTags: string[];
  elementTags: string[];
  privacy: string[];
  color: string[];
  quiet: string[];
  time: string[];
}
const TAG_ENCODINGS: Tags = {
  stealthTags: STEALTH_TAGS,
  animalTags: ANIMAL_TAGS,
  weaponTags: WEAPON_TAGS,
  secureTags: SECURE_PLACE_TAGS,
  elementTags: ELEMENT_TAGS,
  privacy: PRIVACY_TAGS,
  color: COLOR_TAGS,
  quiet: QUIET_TAGS,
  time: CELESTIAL_TIME_TAGS
};

export const getRandomQuickAliasTag = () => {
  const tagTypeOne = Object.keys(TAG_ENCODINGS)[Math.floor(Math.random() * Object.keys(TAG_ENCODINGS).length)];
  // exclude the first tag type from the second tag type
  const tagTypeTwo = Object.keys(TAG_ENCODINGS).filter((tagType) => tagType !== tagTypeOne)[
    Math.floor(Math.random() * (Object.keys(TAG_ENCODINGS).length - 1))
  ];
  const tagListOne = TAG_ENCODINGS[tagTypeOne as keyof Tags] as Array<string>;
  const tagListTwo = TAG_ENCODINGS[tagTypeTwo as keyof Tags] as Array<string>;
  const randomTagOne = tagListOne[Math.floor(Math.random() * tagListOne.length)] || '';
  const randomTagTwo = tagListTwo[Math.floor(Math.random() * tagListTwo.length)] || '';
  return `${randomTagOne}${randomTagTwo}`;
};
