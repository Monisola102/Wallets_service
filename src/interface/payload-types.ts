export interface PayloadType {
  sub: string;
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  googleId?: string;
}