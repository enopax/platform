import type { User, UserRole } from '../types';

export interface CreateUserData {
  name?: string;
  firstname?: string;
  lastname?: string;
  email: string;
  image?: string;
  role?: UserRole;
  password?: string;
}

export interface UpdateUserData {
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email?: string;
  image?: string | null;
  role?: UserRole;
  password?: string;
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(options?: { skip?: number; take?: number; orderBy?: 'createdAt' }): Promise<User[]>;
  update(id: string, data: UpdateUserData): Promise<User>;
  search(query: string, limit?: number): Promise<UserSearchResult[]>;
  count(): Promise<number>;
}
