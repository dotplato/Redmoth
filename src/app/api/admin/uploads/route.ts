import { requireAdmin } from "@/lib/require-admin";
import { presignResponse } from "@/lib/uploads";

/** Presigned upload for admins. SVG allowed, as before. */
export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  return presignResponse(request, { allowSvg: true });
}
