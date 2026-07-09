import type { Response } from "express";

type SuccessResponseInput = {
    statusCode?: number;
    message?: string;
    data?: unknown;
    meta?: unknown;
}

export const sendSuccess =  (
    res: Response,
    input: SuccessResponseInput,
) => {
    const response: Record<string, unknown> ={};

    if ( input.message ) response.message = input.message;
    if ( input.data !== undefined ) response.data = input.data;
    if ( input.meta !== undefined) response.meta = input.meta;

    return res.status(input.statusCode ?? 200).json(response);
}

export const sendError = (
    res: Response,
    statusCode: number,
    message: string,
) => {
    return res.status(statusCode).json({
        message
    });
};