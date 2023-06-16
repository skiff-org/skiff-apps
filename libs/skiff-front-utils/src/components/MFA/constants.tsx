export enum StepsMFA {
  /** Modal not open */
  LANDING_PAGE,
  /** Generate and show TOTP QR code */
  VIEW_QR_CODE_MFA,
  /** Prompt user to verify TOTP code */
  ENTER_MFA,
  /** Generate and show one-time backup codes */
  GENERATE_BACKUP_CODES,
  /** Success message */
  CONFIRM_CODE_COMPLETE_MFA
}
