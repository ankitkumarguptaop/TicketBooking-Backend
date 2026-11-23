export enum SessionRevocationReason {
  /** The user logged out on this device. */
  LOGOUT = 'LOGOUT',
  /** The user chose "log out of all devices". */
  LOGOUT_ALL = 'LOGOUT_ALL',
  /** The user ended this session from another device's session list. */
  REVOKED_BY_USER = 'REVOKED_BY_USER',
  /** A rotated (old) refresh token was presented again: token theft assumed. */
  REUSE_DETECTED = 'REUSE_DETECTED',
  /** The password was reset: every device must sign in with the new one. */
  PASSWORD_RESET = 'PASSWORD_RESET',
  /** The user behind the session no longer exists. */
  USER_GONE = 'USER_GONE',
}
