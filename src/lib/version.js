// A single source of truth for "which build is this" — shown in the app
// footer and can be compared against the backend's /api/health response.
// Bump this string every time a new zip is produced so a stale deploy is
// obvious at a glance instead of requiring a debugging session to detect.
export const APP_VERSION = "2026-07-04T23:23Z";
