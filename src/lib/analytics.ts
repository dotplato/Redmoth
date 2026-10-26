import { EventType } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "./prisma";

/** Records an analytics event once the response has been sent, so pages and redirects never wait on it. */
export function track(toolId: string, type: EventType) {
  after(() => prisma.event.create({ data: { toolId, type } }));
}
