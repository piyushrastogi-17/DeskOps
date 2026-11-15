
import type { Request, Response, NextFunction } from "express";

import * as ticketService from "./ticket.service";
import { createTicketSchema } from "./ticket.validation";

export async function createTicket(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = createTicketSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed.",
          details: validation.error.flatten(),
        },
      });
    }

    const organizationId = req.tenant!.organizationId;

    const ticket = await ticketService.createTicket(
      organizationId,
      validation.data,
    );

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      data: ticket,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listTickets(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const organizationId = req.tenant!.organizationId;

    const tickets = await ticketService.listTickets(organizationId);

    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    return next(error);
  }
}
