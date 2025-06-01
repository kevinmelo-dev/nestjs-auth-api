import { ArgumentsHost, Catch, HttpStatus, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor.';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
        switch (exception.code) {
            case 'P2002': 
                status = HttpStatus.CONFLICT;
                const target = (exception.meta?.target as string[])?.join(', ');
                message = `Um registro com este ${target} já existe.`;
                break;
            case 'P2025': 
                status = HttpStatus.NOT_FOUND;
                message = 'O registro solicitado não foi encontrado.';
                break;
            default:
                status = HttpStatus.BAD_REQUEST;
                message = `Erro de banco de dados: ${exception.message.replace(/\n/g, '')}`;
                break;
        }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
        status = HttpStatus.BAD_REQUEST;
        message = `Validation error: Invalid data provided. ${exception.message.replace(/\n/g, '')}`;
    }
    
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });

  }
}