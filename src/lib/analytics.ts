import { EventType } from "@prisma/client";
import { prisma } from "./prisma";

export async function track(toolId: string, type: EventType) {
  await prisma.event.create({ data: { toolId, type } });
}
