function getLegacySchoolTicket(pet) {
  const reservableCount = Number(pet.totalReservableCountByType?.school ?? 0);

  return {
    id: `legacy-school-ticket-${pet.id}`,
    name: pet.ticketName ?? '유치원 이용권',
    reservableCount,
    ...pet.schoolTicket,
  };
}

export function getSchoolTickets(pet) {
  return Array.isArray(pet.schoolTickets) && pet.schoolTickets.length > 0
    ? pet.schoolTickets
    : [getLegacySchoolTicket(pet)];
}

export function getTicketReservableCount(ticket) {
  return Math.max(0, Number(ticket?.reservableCount ?? 0));
}

export function getSchoolTicket(pet, ticketId) {
  return getSchoolTickets(pet).find((ticket) => ticket.id === ticketId) ?? null;
}

export function getPetReservableCount(pet) {
  return getSchoolTickets(pet)
    .reduce((total, ticket) => total + getTicketReservableCount(ticket), 0);
}
