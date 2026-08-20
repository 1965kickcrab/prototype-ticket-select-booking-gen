const SCHOOL_RESERVATION_LIST_KEY = 'schoolReservationList';

function readList(key, fallbackValue) {
  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;

    return Array.isArray(parsedValue) ? parsedValue : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function normalizeReservation(reservation) {
  const {
    classId: _classId,
    className: _className,
    classSnapshot: _classSnapshot,
    ...reservationWithoutClass
  } = reservation;

  if (reservationWithoutClass.createdAt) return reservationWithoutClass;

  return {
    ...reservationWithoutClass,
    createdAt: `${reservation.date ?? '2025-01-01'}T14:35:00`,
  };
}

export function getSchoolReservationData() {
  return {
    schoolReservationList: readList(SCHOOL_RESERVATION_LIST_KEY, []).map(normalizeReservation),
  };
}

export function saveSchoolReservationList(schoolReservationList) {
  window.localStorage.setItem(
    SCHOOL_RESERVATION_LIST_KEY,
    JSON.stringify(schoolReservationList.map(normalizeReservation)),
  );
}
