const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAYCARE_BUSINESS_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const DAYCARE_CAPACITY = 4;

export function getPetRemainingCount(pet) {
  return Number(pet.totalReservableCountByType?.school ?? 0);
}

export function canSelectPet(pet) {
  return getPetRemainingCount(pet) > 0;
}

export function getSelectedPetAvailability(pets, schoolReservationList, selectedPetIds, dateKey) {
  const selectedPets = pets.filter((pet) => selectedPetIds.has(pet.id));

  if (selectedPets.length === 0) {
    return { status: 'unavailable' };
  }

  const date = new Date(`${dateKey}T00:00:00`);
  const dayKey = DAY_KEY_BY_INDEX[date.getDay()];
  const hasBusinessDay = DAYCARE_BUSINESS_DAYS.includes(dayKey);
  const hasExistingReservation = selectedPets.some((pet) => schoolReservationList.some((reservation) => (
    reservation.status !== '취소'
    && reservation.petId === pet.id
    && reservation.date === dateKey
  )));
  const reservationCount = schoolReservationList.filter((reservation) => (
    reservation.status !== '취소' && reservation.date === dateKey
  )).length;
  const hasReachedCapacity = reservationCount + selectedPets.length > DAYCARE_CAPACITY;

  if (!hasBusinessDay || hasExistingReservation) {
    return { status: 'unavailable' };
  }

  if (hasReachedCapacity) {
    return { status: 'full' };
  }

  return { status: 'available' };
}
