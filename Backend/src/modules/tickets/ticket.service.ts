
import * as ticketRepository from "./ticket.repository";
import type { CreateTicketInput } from "./ticket.validation";

export async function createTicket(
  organizationId: string,
  input: CreateTicketInput,
) {
  return ticketRepository.createTicket(organizationId, input);
}

export async function listTickets(organizationId: string) {
  return ticketRepository.getTickets(organizationId);
}

export async function getTicket(
  organizationId: string,
  ticketId: string,
) {
  const ticket = await ticketRepository.getTicketById(
    organizationId,
    ticketId,
  );

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  return ticket;
}
