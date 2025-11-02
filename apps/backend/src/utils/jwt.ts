import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '@pulss/types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const generateTokens = (
  userId: string,
  email: string,
  role: string,
  tenantId: string,
  _type?: 'user' | 'customer'
): AuthTokens => {
  const accessPayload: JWTPayload = {
    userId,
    email,
    role,
    tenantId,
    type: 'access',
  };

  const refreshPayload: JWTPayload = {
    userId,
    email,
    role,
    tenantId,
    type: 'refresh',
  };

  const accessToken = jwt.sign(
    accessPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );

  const refreshToken = jwt.sign(
    refreshPayload,
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};

