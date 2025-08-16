import { User } from '@prisma/client';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenantId?: string;
      tenantSlug?: string;
    }
    
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export interface RequestWithUser extends Request {
  user?: User;
  headers: Request['headers'];
}
