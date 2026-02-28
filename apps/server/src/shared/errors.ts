import { HTTPException } from 'hono/http-exception';
export const err = {
  unauthorized: (m = 'Unauthorized') => new HTTPException(401, { message: m }),
  forbidden: (m = 'Forbidden') => new HTTPException(403, { message: m }),
  notFound: (m = 'Not found') => new HTTPException(404, { message: m }),
  badRequest: (m = 'Bad request') => new HTTPException(400, { message: m }),
  conflict: (m = 'Conflict') => new HTTPException(409, { message: m }),
};
