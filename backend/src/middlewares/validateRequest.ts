import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestValidationSchemas = {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
}

type ValidationSource = keyof RequestValidationSchemas;

const formatZodErrors = ( source: ValidationSource, error: any ) => {
    return error.issues.map((issue: any) => ({
        source,
        field: issue.path.length > 0 ? issue.path.join(".") : source,
        message: issue.message,
        code: issue.code,
    }));
};

export const validateRequest = (
    schemas: RequestValidationSchemas,
): RequestHandler => {
    return (req, res, next) => {
        const validated: Record<string, unknown> = {};
        const errors: any[] = [];
        for (const source of ["params", "query", "body"] as ValidationSource[]) {
            const schema = schemas[source];

            if (!schema) continue;

            const value = req[source];
            const result = schema.safeParse(value);

            if(!result.success) {
                errors.push(...formatZodErrors(source, result.error));
            }else {
                validated[source] = result.data;
            }
        }

        if (errors.length > 0) {
            res.status(400).json({
                message: "Validation failed",
                errors,
            });
            return;
        }

        res.locals.validated = validated;
        next();
    }
}
