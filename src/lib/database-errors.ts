export function isDatabaseAuthError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };

  return (
    maybeError.code === "P1000" ||
    maybeError.message?.includes("Authentication failed against the database") ||
    maybeError.message?.includes("autentificaci")
  );
}

export function databaseAuthMessage() {
  return "PostgreSQL rechazo las credenciales. Revisa DATABASE_URL en .env.local o resetea la contrasena del usuario postgres.";
}
