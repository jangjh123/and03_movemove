import { HttpStatus } from '@nestjs/common';
import { ErrorCodeEnum } from 'src/enum/exception.enum';
import { BaseException } from './base.exception';

export class InvalidRefreshTokenException extends BaseException {
  constructor() {
    super(ErrorCodeEnum.InvalidRefreshToken, HttpStatus.UNAUTHORIZED);
  }
}