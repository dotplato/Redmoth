import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth's endpoints: sign-up, sign-in, sign-out, email verification, password reset.
export const { GET, POST } = toNextJsHandler(auth);
