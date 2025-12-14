export function resolveUserEmailFromHeaders(input: {
  headerEmail: string | null;
  proxySecret: string | null;
  nodeEnv: string | undefined;
  authProxySecret: string | undefined;
  defaultUserEmail: string | undefined;
  allowDefaultUserEmailInProd: string | undefined;
}): string | null {
  const {
    headerEmail,
    proxySecret,
    nodeEnv,
    authProxySecret,
    defaultUserEmail,
    allowDefaultUserEmailInProd,
  } = input;

  const isProduction = nodeEnv === "production";
  const hasProxySecret = Boolean(authProxySecret);
  const trustedHeaderEmail =
    headerEmail &&
    (!isProduction || (hasProxySecret && proxySecret === authProxySecret));

  if (trustedHeaderEmail) {
    return headerEmail;
  }

  const defaultEmail = defaultUserEmail ?? null;
  if (!defaultEmail) {
    return null;
  }

  if (!isProduction) {
    return defaultEmail;
  }

  if (allowDefaultUserEmailInProd === "true") {
    return defaultEmail;
  }

  return null;
}
