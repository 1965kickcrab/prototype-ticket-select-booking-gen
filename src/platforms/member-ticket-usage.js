import { createMemberTicketUsageState } from "../features/member-ticket-usage/member-ticket-usage-state.js";
import { renderMemberTicketUsage } from "../features/member-ticket-usage/member-ticket-usage-renderer.js";

const rootElement = document.querySelector("#app");
renderMemberTicketUsage(rootElement, createMemberTicketUsageState());
