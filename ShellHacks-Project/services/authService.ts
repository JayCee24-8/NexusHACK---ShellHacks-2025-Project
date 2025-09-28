import type { User } from "../types";
import api from "./api";

// We assume these endpoints based on standard REST practices, as they were not in the docs.
export async function registerUser(userData: Omit<User, "id">): Promise<User> {
  const { user } = await api<{ user: User }>(
    "POST",
    "/auth/register",
    userData
  );
  return user;
}

export async function login(
  email: string,
  password_DO_NOT_USE: string
): Promise<User> {
  const { user } = await api<{ user: User }>("POST", "/auth/login", {
    email,
    password: password_DO_NOT_USE,
  });
  return user;
}

export async function logout(): Promise<void> {
  await api("POST", "/auth/logout");
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api("POST", "/auth/request-reset", { email });
}

export async function getCurrentUserSession(): Promise<User> {
  const { user } = await api<{ user: User }>("GET", "/users/me");
  return user;
}

export async function updateUser(updatedUser: Partial<User>): Promise<User> {
  const { user } = await api<{ user: User }>("PATCH", "/users/me", updatedUser);
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  const { users } = await api<{ users: User[] }>("GET", "/users");
  return users;
}
