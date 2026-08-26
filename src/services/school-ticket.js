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

function getDateSortValue(dateValue) {
  const timestamp = Date.parse(dateValue ?? '');

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getValiditySortValue(ticket) {
  const validityDays = Number(ticket.validityDays);

  return Number.isFinite(validityDays) ? validityDays : Number.POSITIVE_INFINITY;
}

export function getDefaultSchoolTicket(pet) {
  return getSchoolTickets(pet)
    .filter((ticket) => getTicketReservableCount(ticket) > 0)
    .sort((left, right) => {
      const stateDifference = Number(Boolean(left.expiryDate)) - Number(Boolean(right.expiryDate));

      if (stateDifference !== 0) return -stateDifference;

      const leftExpiryDate = getDateSortValue(left.expiryDate);
      const rightExpiryDate = getDateSortValue(right.expiryDate);

      if (leftExpiryDate < rightExpiryDate) return -1;
      if (leftExpiryDate > rightExpiryDate) return 1;

      return getValiditySortValue(left) - getValiditySortValue(right);
    })[0] ?? null;
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
