export class SessionResponseDto {
  id!: string;
  deviceName!: string | null;
  userAgent!: string | null;
  ipAddress!: string | null;
  createdAt!: Date;
  lastUsedAt!: Date;
  expiresAt!: Date;
  current!: boolean;
}
