import {
  decreaseSchoolRemainingCount,
  getStoredMembers,
  updateSchoolTicketCounts,
} from '../storage/member-storage.js';
import { getSchoolReservationData, saveSchoolReservationList } from '../storage/school-reservation-storage.js';
import { getSelectedPetAvailability } from './reservation-availability.js';
import { getSchoolTicket, getTicketReservableCount } from './school-ticket.js';

function createReservationId() {
  if (window.crypto?.randomUUID) return `school-reservation-${window.crypto.randomUUID()}`;

  return `school-reservation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createReservationGroupId() {
  if (window.crypto?.randomUUID) return `school-reservation-group-${window.crypto.randomUUID()}`;

  return `school-reservation-group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTodayKey() {
  const today = new Date();

  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
}

function createReservation({ guardian, pet, ticket, date, reservationId, createdAt }) {
  return {
    id: createReservationId(),
    reservationId,
    createdAt,
    date,
    status: '예약',
    businessName: '다이얼독 유치원',
    serviceType: '유치원',
    memberId: guardian.id,
    petId: pet.id,
    petName: pet.petName,
    breed: pet.breed ?? '',
    ticketId: ticket.id,
    ticketName: ticket.name,
    ticketSnapshot: {
      id: ticket.id,
      name: ticket.name,
    },
    guardianName: guardian.guardianName,
    phoneNumber: guardian.phoneNumber ?? '',
    address: guardian.address ?? '',
    addressDetail: guardian.addressDetail ?? '',
    ownerTags: guardian.ownerTags ?? [],
    petTags: pet.petTags ?? [],
    birthDate: pet.birthDate ?? '',
    animalRegistrationNumber: pet.animalRegistrationNumber ?? '',
    coatColor: pet.coatColor ?? '',
    weight: pet.weight ?? '',
    gender: pet.gender ?? '선택 안함',
    neuteredStatus: pet.neuteredStatus ?? '',
    memo: pet.memo ?? '',
    totalReservableCount: Number(pet.totalReservableCountByType?.school ?? 0),
  };
}

export function createSchoolReservations({ memberId, petIds, ticketIdsByPetId, ticketIdsByDateAndPet, dateKeys }) {
  const { schoolReservationList } = getSchoolReservationData();
  const guardian = getStoredMembers().find((member) => member.id === memberId);
  const selectedPets = guardian?.pets.filter((pet) => petIds.includes(pet.id)) ?? [];
  const selectedPetIds = new Set(selectedPets.map((pet) => pet.id));
  const uniqueDateKeys = [...new Set(dateKeys)].sort();
  const todayKey = getTodayKey();

  if (
    !guardian
    || selectedPets.length !== petIds.length
    || uniqueDateKeys.length === 0
  ) {
    return { ok: false, message: '예약 정보를 다시 확인해주세요.' };
  }

  const ticketAssignments = uniqueDateKeys.flatMap((date) => selectedPets.map((pet) => {
    const ticketId = ticketIdsByDateAndPet?.[date]?.[pet.id] ?? ticketIdsByPetId?.[pet.id];

    return {
      date,
      pet,
      ticket: getSchoolTicket(pet, ticketId),
    };
  }));

  if (ticketAssignments.some(({ ticket }) => !ticket)) {
    return { ok: false, message: '반려견별 이용권 선택을 확인해주세요.' };
  }

  const ticketUsageCounts = ticketAssignments.reduce((usageCounts, assignment) => {
    const usageKey = `${assignment.pet.id}:${assignment.ticket.id}`;

    usageCounts.set(usageKey, (usageCounts.get(usageKey) ?? 0) + 1);

    return usageCounts;
  }, new Map());
  const hasInsufficientTicket = [...ticketUsageCounts.entries()].some(([usageKey, usageCount]) => {
    const [petId, ticketId] = usageKey.split(':');
    const pet = selectedPets.find((selectedPet) => selectedPet.id === petId);
    const ticket = getSchoolTicket(pet, ticketId);

    return usageCount > getTicketReservableCount(ticket);
  });

  if (hasInsufficientTicket) {
    return { ok: false, message: '예약 가능한 이용권 횟수가 부족합니다.' };
  }

  const unavailableDate = uniqueDateKeys.find((dateKey) => (
    dateKey < todayKey
    || getSelectedPetAvailability(
      guardian.pets,
      schoolReservationList,
      selectedPetIds,
      dateKey,
    ).status !== 'available'
  ));

  if (unavailableDate) return { ok: false, message: `${unavailableDate}에는 예약할 수 없습니다.` };

  const reservationId = createReservationGroupId();
  const createdAt = new Date().toISOString();
  const reservations = ticketAssignments.map(({ date, pet, ticket }) => createReservation({
    guardian,
    pet,
    ticket,
    date,
    reservationId,
    createdAt,
  }));

  saveSchoolReservationList([...schoolReservationList, ...reservations]);
  updateSchoolTicketCounts(memberId, ticketAssignments.map(({ pet, ticket }) => ({
    petId: pet.id,
    ticketId: ticket.id,
    reservationCountChange: 1,
  })));

  return { ok: true, reservations };
}

export function cancelSchoolReservations(reservationIds) {
  const { schoolReservationList } = getSchoolReservationData();
  const targetReservationIds = new Set(reservationIds);
  const reservations = schoolReservationList.filter((item) => targetReservationIds.has(item.id));
  const todayKey = getTodayKey();

  if (targetReservationIds.size === 0 || reservations.length !== targetReservationIds.size || reservations.some((reservation) => reservation.status === '취소')) {
    return { ok: false, message: '취소할 예약을 찾을 수 없습니다.' };
  }

  if (reservations.some((reservation) => reservation.date <= todayKey)) {
    return { ok: false, message: '예약일 전까지만 예약을 취소할 수 있습니다.' };
  }

  const updatedReservations = schoolReservationList.map((item) => (
    targetReservationIds.has(item.id) ? { ...item, status: '취소' } : item
  ));

  saveSchoolReservationList(updatedReservations);
  const ticketChangesByMemberId = reservations.reduce((changesByMember, reservation) => {
    if (!reservation.ticketId) return changesByMember;

    const ticketChanges = changesByMember.get(reservation.memberId) ?? [];
    ticketChanges.push({
      petId: reservation.petId,
      ticketId: reservation.ticketId,
      reservationCountChange: -1,
    });
    changesByMember.set(reservation.memberId, ticketChanges);

    return changesByMember;
  }, new Map());

  ticketChangesByMemberId.forEach((ticketChanges, memberId) => {
    updateSchoolTicketCounts(memberId, ticketChanges);
  });

  return { ok: true, reservations: reservations.map((reservation) => ({ ...reservation, status: '취소' })) };
}

export function cancelSchoolReservation(reservationId) {
  const result = cancelSchoolReservations([reservationId]);

  return result.ok
    ? { ok: true, reservation: result.reservations[0] }
    : result;
}

const APPLIED_ATTENDANCE_IDS_KEY = 'schoolReservationAttendanceAppliedIds';

function getAppliedAttendanceIds() {
  try {
    const storedValue = window.localStorage.getItem(APPLIED_ATTENDANCE_IDS_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return new Set(Array.isArray(parsedValue) ? parsedValue : []);
  } catch {
    return new Set();
  }
}

export function applyPastSchoolReservationAttendance() {
  const { schoolReservationList } = getSchoolReservationData();
  const appliedReservationIds = getAppliedAttendanceIds();
  const todayKey = getTodayKey();
  const completedReservations = schoolReservationList.filter((reservation) => (
    reservation.status === '예약'
    && reservation.date < todayKey
    && !appliedReservationIds.has(reservation.id)
  ));

  completedReservations.forEach((reservation) => {
    decreaseSchoolRemainingCount(reservation.memberId, reservation.petId);
    appliedReservationIds.add(reservation.id);
  });

  if (completedReservations.length > 0) {
    window.localStorage.setItem(APPLIED_ATTENDANCE_IDS_KEY, JSON.stringify([...appliedReservationIds]));
  }

  return completedReservations.length;
}
