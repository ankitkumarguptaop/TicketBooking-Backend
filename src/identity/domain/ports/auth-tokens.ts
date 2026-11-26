/** What login and refresh hand to the presentation layer to put in cookies. */
export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
