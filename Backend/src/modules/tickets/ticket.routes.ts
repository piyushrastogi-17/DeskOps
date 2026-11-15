
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireTenant } from "../../middlewares/tenant.middleware";

import {
  createTicket,
  listTickets,
} from "./ticket.controller";

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post("/", createTicket);
router.get("/", listTickets);

export default router;
