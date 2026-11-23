import { BadRequestException, PipeTransform } from '@nestjs/common';
import {
  ContactChannel,
  VerificationChannel,
} from '../../domain/verification/verification-channel.enum';

/** URL segment ("email" | "phone") -> domain channel. Anything else is a 400. */
export const parseChannel: PipeTransform<string, ContactChannel> = {
  transform(value: string): ContactChannel {
    if (value === 'email') return VerificationChannel.EMAIL;
    if (value === 'phone') return VerificationChannel.PHONE;
    throw new BadRequestException('channel must be "email" or "phone"');
  },
};
