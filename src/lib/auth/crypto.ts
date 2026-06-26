import "server-only";
import { randomBytes, createHash } from "node:crypto";

export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function generateInviteCode() {
  return randomBytes(16).toString("base64url");
}

export function generatePasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function generateEmailVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
