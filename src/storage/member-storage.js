import { DEFAULT_MEMBER_LIST } from './default-member-list.js';
import { getSchoolTickets, getTicketReservableCount } from '../services/school-ticket.js';

const MEMBER_LIST_KEY = 'memberList';
const DELETED_MEMBER_IDS_KEY = 'prototype.memberTags.deletedMemberIds';

function readList(key) {
  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function mergePets(defaultPets = [], storedPets = []) {
  const storedPetsById = new Map(storedPets.map((pet) => [pet.id, pet]));
  const mergedDefaults = defaultPets.map((pet) => ({ ...pet, ...storedPetsById.get(pet.id) }));
  const additionalPets = storedPets.filter((pet) => !defaultPets.some((defaultPet) => defaultPet.id === pet.id));

  return [...mergedDefaults, ...additionalPets];
}

function mergeMembers(defaultMembers, storedMembers) {
  const storedMembersById = new Map(storedMembers.map((member) => [member.id, member]));
  const mergedDefaults = defaultMembers.map((member) => {
    const storedMember = storedMembersById.get(member.id);

    return storedMember
      ? { ...member, ...storedMember, pets: mergePets(member.pets, storedMember.pets) }
      : member;
  });
  const additionalMembers = storedMembers.filter((member) => !defaultMembers.some((defaultMember) => defaultMember.id === member.id));

  return [...mergedDefaults, ...additionalMembers];
}

export function getStoredMembers() {
  const storedMembers = readList(MEMBER_LIST_KEY);
  const deletedMemberIds = new Set(readList(DELETED_MEMBER_IDS_KEY));

  return mergeMembers(DEFAULT_MEMBER_LIST, storedMembers).filter((member) => !deletedMemberIds.has(member.id));
}

export function updateSchoolTicketCounts(memberId, ticketChanges) {
  const changesByPetId = ticketChanges.reduce((changesByPet, change) => {
    const ticketChangesById = changesByPet.get(change.petId) ?? new Map();

    ticketChangesById.set(
      change.ticketId,
      (ticketChangesById.get(change.ticketId) ?? 0) + Number(change.reservationCountChange ?? 0),
    );
    changesByPet.set(change.petId, ticketChangesById);

    return changesByPet;
  }, new Map());
  const members = getStoredMembers().map((member) => {
    if (member.id !== memberId) return member;

    return {
      ...member,
      pets: member.pets.map((pet) => {
        const ticketChangesById = changesByPetId.get(pet.id);

        if (!ticketChangesById) return pet;

        const schoolTickets = getSchoolTickets(pet).map((ticket) => {
          const reservationCountChange = ticketChangesById.get(ticket.id) ?? 0;

          return {
            ...ticket,
            reservableCount: Math.max(0, getTicketReservableCount(ticket) - reservationCountChange),
          };
        });
        const totalReservableCount = schoolTickets.reduce(
          (total, ticket) => total + getTicketReservableCount(ticket),
          0,
        );
        const totalReservedCount = Math.max(
          0,
          Number(pet.totalReservedCountByType?.school ?? 0)
            + [...ticketChangesById.values()].reduce((total, count) => total + count, 0),
        );

        return {
          ...pet,
          schoolTickets,
          totalReservableCountByType: {
            ...pet.totalReservableCountByType,
            school: totalReservableCount,
          },
          totalReservedCountByType: {
            ...pet.totalReservedCountByType,
            school: totalReservedCount,
          },
        };
      }),
    };
  });

  window.localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(members));

  return members;
}

export function decreaseSchoolRemainingCount(memberId, petId) {
  const members = getStoredMembers().map((member) => {
    if (member.id !== memberId) return member;

    return {
      ...member,
      pets: member.pets.map((pet) => {
        if (pet.id !== petId) return pet;

        return {
          ...pet,
          remainingCountByType: {
            ...pet.remainingCountByType,
            school: Math.max(0, Number(pet.remainingCountByType?.school ?? 0) - 1),
          },
        };
      }),
    };
  });

  window.localStorage.setItem(MEMBER_LIST_KEY, JSON.stringify(members));
}
