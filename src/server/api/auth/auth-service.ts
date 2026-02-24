export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export interface AuthService {
  register(input: RegisterInput): Promise<void>;
  login(input: LoginInput): Promise<{ token: string }>;
  logout(sessionToken: string): Promise<void>;
}
