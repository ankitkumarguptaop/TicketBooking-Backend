export class ScreenSummaryResponseDto {
  id!: string;
  name!: string;
  seatCount!: number;
}

export class TheatreResponseDto {
  id!: string;
  name!: string;
  city!: string;
  address!: string;
  screens!: ScreenSummaryResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
