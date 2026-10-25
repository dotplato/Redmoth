// Shared by the submit form (client-side checks) and the upload/submit routes (enforcement).
export const MAX_SCREENSHOTS = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const RASTER_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
