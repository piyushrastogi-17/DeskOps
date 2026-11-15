
import {
  Prisma,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";

import prisma from "../../config/database";

type CreateTicketInput = {
  title: string;
  description: string;
  priority?: TicketPriority;
};

type UpdateTicketInput = {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
};

/**
 * Every ticket operation requires a trusted organizationId
 * obtained from the authenticated request context.
 */

export async function createTicket(
  organizationId: string,
  input: CreateTicketInput,
) {
  return prisma.ticket.create({
    data: {
      organizationId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? TicketPriority.MEDIUM,
    },
  });
}

export async function getTickets(organizationId: string) {
  return prisma.ticket.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTicketById(
  organizationId: string,
  ticketId: string,
) {
  return prisma.ticket.findFirst({
    where: {
      id: ticketId,
      organizationId,
    },
    include: {
      events: {
        where: { organizationId },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function updateTicket(
  organizationId: string,
  ticketId: string,
  input: UpdateTicketInput,
) {
  const result = await prisma.ticket.updateMany({
    where: {
      id: ticketId,
      organizationId,
    },
    data: input,
  });

  if (result.count === 0) {
    return null;
  }

  return getTicketById(organizationId, ticketId);
}

export async function deleteTicket(
  organizationId: string,
  ticketId: string,
) {
  const result = await prisma.ticket.deleteMany({
    where: {
      id: ticketId,
      organizationId,
    },
  });

  return result.count === 1;
}
