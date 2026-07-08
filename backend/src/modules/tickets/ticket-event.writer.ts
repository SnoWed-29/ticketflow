import { prisma } from "../../db/prisma.js";
import { Prisma, type TicketEventType } from "../../generated/prisma/client.js";

type EventMetadata = Record<string, unknown>;

type WriteTicketEventInput = {
    ticketId: string;
    type: TicketEventType | string;
    actorId?: string | null;
    oldValue?: unknown;
    newValue?:unknown;
    metadata?: EventMetadata;
}

const normalizeEventValue = (value: unknown): string | null => {
    if (value === undefined || value === null) return null;
    if (typeof value === "string") return value;
    return JSON.stringify(value);
};

const normalizeMetadata = (metadata?: EventMetadata): Prisma.InputJsonValue => {
    if (!metadata) return {};
    return JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue;
};

export const writeTicketEvent = async (input: WriteTicketEventInput) => {
    return prisma.ticketEvent.create({
        data: {
            ticketId: input.ticketId,
            type: input.type as TicketEventType,
            actorId: input.actorId ?? null,
            oldValue: normalizeEventValue(input.oldValue),
            newValue: normalizeEventValue(input.newValue),
            metadata: normalizeMetadata(input.metadata),
        },
    });
};
