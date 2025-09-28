import bcrypt from "bcrypt";
import "dotenv/config";

const ROUNDS = 12;
const PEPPER = process.env.PEPPER || "";

export const hashPassword = (plain) => bcrypt.hash(plain + PEPPER, ROUNDS);
export const verifyPassword = (plain, hash) =>
  bcrypt.compare(plain + PEPPER, hash);
