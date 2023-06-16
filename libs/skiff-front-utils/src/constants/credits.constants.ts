export interface BaseCreditPrompt {
  // 'invite', 'import', etc
  action: string;
  // credits in dollars
  amount: number;
  // 'Refer a friend to Skiff'
  description: string;
  // provides more context on the description (e.g You'll receive $1 per file imported)
  hint: string;
}

export const INVITE_BASE_CREDITS_PROMPT: BaseCreditPrompt = {
  action: 'Invite',
  amount: 10,
  description: 'Refer a friend to Skiff',
  hint: 'Both you and your friend will receive $10 after they sign up for Skiff'
};

export const GOOGLE_DOC_IMPORT_BASE_CREDITS_PROMPT: BaseCreditPrompt = {
  action: 'Import',
  amount: 15,
  description: 'Import from Google Docs',
  hint: 'You will receive $1 per file imported'
};

export const IOS_DOWNLOAD_BASE_CREDITS_PROMPT: BaseCreditPrompt = {
  action: 'Download',
  amount: 10,
  description: 'Download the Skiff app for iOS',
  hint: 'You will receive $10 after signing in'
};

export const ANDROID_DOWNLOAD_BASE_CREDITS_PROMPT: BaseCreditPrompt = {
  action: 'Download',
  amount: 10,
  description: 'Download the Skiff app for Android',
  hint: 'You will receive $10 after signing in'
};

export const DESKTOP_DOWNLOAD_BASE_CREDITS_PROMPT: BaseCreditPrompt = {
  action: 'Download',
  amount: 10,
  description: 'Download the Skiff app for Desktop',
  hint: 'You will receive $10 after signing in'
};

export const IMPORT_MAIL_BASE_CREDITS_PROMPT: BaseCreditPrompt = {
  action: 'Import',
  amount: 10,
  description: 'Import mail from Gmail or Outlook',
  hint: 'You will receive $10 after importing'
};
