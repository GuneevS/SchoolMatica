import test from "node:test";
import assert from "node:assert/strict";
import { resolveUserEmailFromHeaders } from "../lib/auth-email";

test("resolveUserEmailFromHeaders: trusts header in non-production", () => {
  const email = resolveUserEmailFromHeaders({
    headerEmail: "teacher@example.com",
    proxySecret: null,
    nodeEnv: "development",
    authProxySecret: "secret",
    defaultUserEmail: undefined,
    allowDefaultUserEmailInProd: undefined,
  });

  assert.equal(email, "teacher@example.com");
});

test("resolveUserEmailFromHeaders: requires matching proxy secret in production", () => {
  const email = resolveUserEmailFromHeaders({
    headerEmail: "teacher@example.com",
    proxySecret: "wrong",
    nodeEnv: "production",
    authProxySecret: "secret",
    defaultUserEmail: undefined,
    allowDefaultUserEmailInProd: undefined,
  });

  assert.equal(email, null);
});

test("resolveUserEmailFromHeaders: accepts header when proxy secret matches in production", () => {
  const email = resolveUserEmailFromHeaders({
    headerEmail: "teacher@example.com",
    proxySecret: "secret",
    nodeEnv: "production",
    authProxySecret: "secret",
    defaultUserEmail: undefined,
    allowDefaultUserEmailInProd: undefined,
  });

  assert.equal(email, "teacher@example.com");
});

test("resolveUserEmailFromHeaders: falls back to DEFAULT_USER_EMAIL in development", () => {
  const email = resolveUserEmailFromHeaders({
    headerEmail: null,
    proxySecret: null,
    nodeEnv: "development",
    authProxySecret: "secret",
    defaultUserEmail: "dev@example.com",
    allowDefaultUserEmailInProd: undefined,
  });

  assert.equal(email, "dev@example.com");
});

test("resolveUserEmailFromHeaders: does not allow DEFAULT_USER_EMAIL in production by default", () => {
  const email = resolveUserEmailFromHeaders({
    headerEmail: null,
    proxySecret: null,
    nodeEnv: "production",
    authProxySecret: "secret",
    defaultUserEmail: "dev@example.com",
    allowDefaultUserEmailInProd: undefined,
  });

  assert.equal(email, null);
});

test("resolveUserEmailFromHeaders: allows DEFAULT_USER_EMAIL in production when explicitly enabled", () => {
  const email = resolveUserEmailFromHeaders({
    headerEmail: null,
    proxySecret: null,
    nodeEnv: "production",
    authProxySecret: "secret",
    defaultUserEmail: "dev@example.com",
    allowDefaultUserEmailInProd: "true",
  });

  assert.equal(email, "dev@example.com");
});
