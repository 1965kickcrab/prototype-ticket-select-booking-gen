import { createMemberDetailState } from "../member-detail/member-detail-state.js";

export function createMemberTicketUsageState() {
  const state = createMemberDetailState();
  const queryParams = new URLSearchParams(window.location.search);
  const ticketHistoryId = queryParams.get("ticketHistoryId") || "";
  const ticketHistories = Array.isArray(state.selectedPet?.ticketHistories)
    ? state.selectedPet.ticketHistories
    : [];

  state.selectedTicketHistory = ticketHistories.find((ticket) => (
    String(ticket.id || ticket.ticketId || ticket.ticketName || "") === ticketHistoryId
  )) || ticketHistories[0] || null;
  state.appTicketDetailTab = queryParams.get("tab") === "usage" ? "usage" : "status";

  return state;
}
