import { corsHeaders } from './cors.ts';

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });

export const ok = (data: unknown, message = 'Success', status = 200) =>
  json({
    success: true,
    message,
    data,
  }, status);

export const fail = (error: unknown) => {
  if (error instanceof HttpError) {
    return json(
      {
        success: false,
        error: error.message,
        statusCode: error.status,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
      error.status,
    );
  }

  return json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error',
      statusCode: 500,
    },
    500,
  );
};

export const ensureMethod = (request: Request, methods: string[]) => {
  if (!methods.includes(request.method)) {
    throw new HttpError(405, `Method ${request.method} not allowed`);
  }
};
