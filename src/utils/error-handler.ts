import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';

export function errorHandler(err: any, res: Response<any, Record<string, any>>) {
    if (!axios.isAxiosError(err))
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

    if (!err.response)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);

    const { status, data } = err.response;
    return res.status(status).json(data);
}