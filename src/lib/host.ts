export function adminHost() {
  return process.env.ADMIN_HOST ?? "admin.localhost:3000";
}

export function isAdminHost(host: string | null) {
  if (!host) return false;
  const expected = adminHost();
  return host === expected || host.startsWith("admin.");
}
