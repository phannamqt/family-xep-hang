import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi hệ thống, vui lòng thử lại';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message ?? message;
    } else if (exception instanceof QueryFailedError) {
      const err = exception as any;
      const code = err.code;

      if (code === '23505') {
        // Unique violation — lấy tên field từ detail
        const detail: string = err.detail ?? '';
        const match = detail.match(/\(([^)]+)\)/);
        const rawField = match?.[1] ?? '';
        const fieldLabels: Record<string, string> = {
          id_card: 'Số CCCD',
          idCard: 'Số CCCD',
          phone: 'Số điện thoại',
          email: 'Email',
          patient_code: 'Mã bệnh nhân',
          patientCode: 'Mã bệnh nhân',
          name: 'Tên',
          visit_code: 'Mã lượt khám',
          visitCode: 'Mã lượt khám',
        };
        const label = fieldLabels[rawField] ?? rawField;
        message = `${label} này đã tồn tại trong hệ thống`;
        status = HttpStatus.CONFLICT;
      } else if (code === '23503') {
        message = 'Dữ liệu liên quan không tồn tại';
        status = HttpStatus.BAD_REQUEST;
      } else if (code === '23502') {
        message = 'Thiếu thông tin bắt buộc';
        status = HttpStatus.BAD_REQUEST;
      } else {
        this.logger.error('DB error', err.message);
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message.join('; ') : message,
    });
  }
}
