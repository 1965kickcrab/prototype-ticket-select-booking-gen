import { getStoredMembers } from '../../storage/member-storage.js';
import { getSchoolReservationData } from '../../storage/school-reservation-storage.js';
import {
  getSelectedPetAvailability,
} from '../../services/reservation-availability.js';
import {
  getPetReservableCount,
  getSchoolTicket,
  getSchoolTickets,
  getTicketReservableCount,
} from '../../services/school-ticket.js';
import {
  applyPastSchoolReservationAttendance,
  createSchoolReservations,
} from '../../services/school-reservation.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function formatMonth(date) {
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function createReservationForm(root, { onClose } = {}) {
  applyPastSchoolReservationAttendance();
  const guardian = getStoredMembers().find((member) => member.guardianName === '김민지');
  const { schoolReservationList } = getSchoolReservationData();
  const pets = guardian?.pets ?? [];
  const today = new Date();
  const state = {
    displayedMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedPetIds: new Set(),
    selectedTicketIdsByPetId: new Map(),
    heldTicketIdsByDate: new Map(),
    activeTicketPetId: null,
    selectedDates: new Set(),
  };

  const petList = root.querySelector('[data-field="pet-list"]');
  const monthLabel = root.querySelector('[data-field="reservation-month-label"]');
  const daysContainer = root.querySelector('[data-field="reservation-calendar-days"]');
  const selectedDateCount = root.querySelector('[data-field="selected-date-count"]');
  const remainingCount = root.querySelector('[data-field="remaining-count"]');
  const submitButton = root.querySelector('[data-action="submit-reservation"]');
  const notice = root.querySelector('.reservation-form__notice');
  const footer = root.querySelector('.reservation-form__footer');
  const ticketSection = root.querySelector('[data-field="ticket-section"]');
  const ticketSelectionField = root.querySelector('[data-action="open-ticket-selection"]');
  const ticketSelectionSummary = root.querySelector('[data-field="ticket-selection-summary"]');
  const ticketSelectionSheet = root.querySelector('.ticket-selection-sheet');
  const ticketTabs = root.querySelector('[data-field="ticket-tabs"]');
  const ticketOptions = root.querySelector('[data-field="ticket-options"]');
  const dateSection = root.querySelector('[data-field="date-section"]');

  notice.hidden = pets.length <= 1;

  function hasSelectedTicketForEveryPet() {
    return state.selectedPetIds.size > 0
      && [...state.selectedPetIds].every((petId) => state.selectedTicketIdsByPetId.has(petId));
  }

  function getRemainingLimit() {
    const selectedPets = pets.filter((pet) => state.selectedPetIds.has(pet.id));
    const selectedTickets = selectedPets.map((pet) => (
      getSchoolTicket(pet, state.selectedTicketIdsByPetId.get(pet.id))
    ));

    return selectedTickets.length > 0 && selectedTickets.every(Boolean)
      ? Math.min(...selectedPets.map((pet) => {
        const ticket = getSchoolTicket(pet, state.selectedTicketIdsByPetId.get(pet.id));

        return Math.max(
          0,
          getTicketReservableCount(ticket) - getTicketHoldCount(pet.id, ticket.id),
        );
      }))
      : 0;
  }

  function getSelectedTicketAvailability() {
    const selectedPets = pets.filter((pet) => state.selectedPetIds.has(pet.id));
    const selectedTickets = selectedPets.map((pet) => (
      getSchoolTicket(pet, state.selectedTicketIdsByPetId.get(pet.id))
    ));

    return selectedTickets.length > 0 && selectedTickets.every(Boolean)
      ? Math.min(...selectedTickets.map(getTicketReservableCount))
      : 0;
  }

  function getTicketHoldCount(petId, ticketId) {
    return [...state.heldTicketIdsByDate.values()]
      .filter((ticketIdsByPetId) => ticketIdsByPetId.get(petId) === ticketId)
      .length;
  }

  function renderSummary() {
    const remaining = getSelectedTicketAvailability();
    selectedDateCount.textContent = `${state.selectedDates.size}건`;
    remainingCount.textContent = `${remaining}회`;
    submitButton.disabled = state.selectedPetIds.size === 0
      || !hasSelectedTicketForEveryPet()
      || state.selectedDates.size === 0;
    footer.hidden = state.selectedPetIds.size === 0;
  }

  function renderPets() {
    petList.innerHTML = getPetsSorted().map((pet) => {
      const remaining = getPetReservableCount(pet);
      const isSelected = state.selectedPetIds.has(pet.id);
      const disabled = remaining === 0;
      const availabilityLabel = `${remaining}회 예약 가능`;

      return `
        <button class="pet-selector__item surface-card${isSelected ? ' surface-card--selected pet-selector__item--selected' : ''}" type="button" data-action="toggle-pet" data-pet-id="${pet.id}" ${disabled ? 'disabled' : ''} aria-pressed="${isSelected}">
          <span class="pet-selector__check" aria-hidden="true">${isSelected ? '✓' : ''}</span>
          <span class="pet-selector__name">${pet.petName}</span>
          <span class="pet-selector__count">${availabilityLabel}</span>
        </button>
      `;
    }).join('');
  }

  function getPetsSorted() {
    return [...pets].sort((left, right) => left.petName.localeCompare(right.petName, 'ko-KR'));
  }

  function getSelectedPetsSorted() {
    return getPetsSorted()
      .filter((pet) => state.selectedPetIds.has(pet.id))
  }

  function renderTicketSelection() {
    const selectedPets = getSelectedPetsSorted();
    const selectedTicketCount = selectedPets.filter((pet) => (
      state.selectedTicketIdsByPetId.has(pet.id)
    )).length;

    ticketSection.hidden = false;
    ticketSelectionField.disabled = selectedPets.length === 0;
    ticketSelectionSummary.textContent = `이용권 선택 (${selectedTicketCount}/${selectedPets.length})`;
  }

  function renderTicketOptions() {
    const pet = pets.find((item) => item.id === state.activeTicketPetId);

    if (!pet) return;

    const selectedTicketId = state.selectedTicketIdsByPetId.get(pet.id);
    const selectedPets = getSelectedPetsSorted();
    ticketTabs.innerHTML = selectedPets.map((selectedPet) => `
      <button class="ticket-selection-sheet__tab${selectedPet.id === pet.id ? ' ticket-selection-sheet__tab--selected' : ''}" type="button" data-action="switch-ticket-pet" data-pet-id="${selectedPet.id}" role="tab" aria-selected="${selectedPet.id === pet.id}">
        ${selectedPet.petName}
      </button>
    `).join('');
    ticketOptions.innerHTML = getSchoolTickets(pet).map((ticket) => {
      const isSelected = ticket.id === selectedTicketId;
      const remaining = Math.max(0, getTicketReservableCount(ticket) - getTicketHoldCount(pet.id, ticket.id));

      return `
        <button class="ticket-selection-sheet__option${isSelected ? ' ticket-selection-sheet__option--selected' : ''}" type="button" data-action="select-ticket" data-ticket-id="${ticket.id}" ${remaining === 0 && !isSelected ? 'disabled' : ''} aria-pressed="${isSelected}">
          <span>${ticket.name}</span>
          <span>예약 가능 ${remaining}회</span>
          <span class="ticket-selection-sheet__check${isSelected ? ' ticket-selection-sheet__check--selected' : ''}" aria-hidden="true">${isSelected ? '✓' : ''}</span>
        </button>
      `;
    }).join('');
  }

  function getDateStatus(dateKey) {
    const todayKey = toDateKey(today);

    if (dateKey < todayKey) {
      return 'unavailable';
    }

    if (!hasSelectedTicketForEveryPet()) {
      return 'unavailable';
    }

    if (state.selectedDates.has(dateKey)) {
      return 'selected';
    }

    return getSelectedPetAvailability(pets, schoolReservationList, state.selectedPetIds, dateKey).status;
  }

  function renderCalendar() {
    const { displayedMonth } = state;
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const canSelectDate = hasSelectedTicketForEveryPet();

    monthLabel.textContent = formatMonth(displayedMonth);
    dateSection.dataset.state = canSelectDate ? 'ready' : 'locked';
    daysContainer.innerHTML = '';

    for (let index = 0; index < firstWeekday; index += 1) {
      const blankCell = document.createElement('span');
      blankCell.className = 'calendar__empty-cell';
      blankCell.setAttribute('aria-hidden', 'true');
      daysContainer.append(blankCell);
    }

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);
      const status = getDateStatus(dateKey);
      const isDisabled = status === 'unavailable' || status === 'full';
      const dateButton = document.createElement('button');

      dateButton.className = `calendar__day calendar__day--${status}`;
      dateButton.type = 'button';
      dateButton.dataset.action = 'toggle-reservation-date';
      dateButton.dataset.date = dateKey;
      dateButton.disabled = isDisabled;
      dateButton.setAttribute('role', 'gridcell');
      dateButton.setAttribute('aria-label', `${month + 1}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})${status === 'full' ? ', 정원 마감' : ''}`);
      dateButton.innerHTML = `<span class="calendar__day-number">${day}</span>${status === 'full' ? '<span class="calendar__day-note">정원마감</span>' : ''}`;
      daysContainer.append(dateButton);
    }
  }

  function render() {
    renderPets();
    renderTicketSelection();
    renderCalendar();
    renderSummary();
  }

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'close-reservation-form') {
      onClose?.();
      return;
    }

    if (actionTarget.dataset.action === 'toggle-pet') {
      const { petId } = actionTarget.dataset;

      if (state.selectedPetIds.has(petId)) state.selectedPetIds.delete(petId);
      else state.selectedPetIds.add(petId);

      state.selectedTicketIdsByPetId.delete(petId);
      state.selectedDates.clear();
      state.heldTicketIdsByDate.clear();
      render();
    }

    if (actionTarget.dataset.action === 'open-ticket-selection') {
      state.activeTicketPetId = state.activeTicketPetId && state.selectedPetIds.has(state.activeTicketPetId)
        ? state.activeTicketPetId
        : getSelectedPetsSorted()[0]?.id;
      renderTicketOptions();
      ticketSelectionSheet.hidden = false;
      ticketSelectionSheet.dataset.state = 'visible';
    }

    if (actionTarget.dataset.action === 'close-ticket-selection') {
      ticketSelectionSheet.hidden = true;
      ticketSelectionSheet.dataset.state = 'hidden';
    }

    if (actionTarget.dataset.action === 'select-ticket') {
      state.selectedTicketIdsByPetId.set(state.activeTicketPetId, actionTarget.dataset.ticketId);
      render();
      renderTicketOptions();
    }

    if (actionTarget.dataset.action === 'switch-ticket-pet') {
      state.activeTicketPetId = actionTarget.dataset.petId;
      renderTicketOptions();
    }

    if (actionTarget.dataset.action === 'previous-reservation-month') {
      state.displayedMonth = new Date(state.displayedMonth.getFullYear(), state.displayedMonth.getMonth() - 1, 1);
      renderCalendar();
    }

    if (actionTarget.dataset.action === 'next-reservation-month') {
      state.displayedMonth = new Date(state.displayedMonth.getFullYear(), state.displayedMonth.getMonth() + 1, 1);
      renderCalendar();
    }

    if (actionTarget.dataset.action === 'toggle-reservation-date') {
      const { date } = actionTarget.dataset;

      if (state.selectedDates.has(date)) {
        state.selectedDates.delete(date);
        state.heldTicketIdsByDate.delete(date);
      } else if (getRemainingLimit() > 0) {
        state.selectedDates.add(date);
        state.heldTicketIdsByDate.set(date, new Map(
          getSelectedPetsSorted().map((pet) => [
            pet.id,
            state.selectedTicketIdsByPetId.get(pet.id),
          ]),
        ));
      }

      render();
    }

    if (actionTarget.dataset.action === 'submit-reservation') {
      const result = createSchoolReservations({
        memberId: guardian?.id,
        petIds: [...state.selectedPetIds],
        ticketIdsByPetId: Object.fromEntries(state.selectedTicketIdsByPetId),
        ticketIdsByDateAndPet: Object.fromEntries(
          [...state.heldTicketIdsByDate].map(([date, ticketIdsByPetId]) => [
            date,
            Object.fromEntries(ticketIdsByPetId),
          ]),
        ),
        dateKeys: [...state.selectedDates],
      });

      if (!result.ok) {
        window.alert(result.message);
        render();
        return;
      }

      const reservationCreatedAt = result.reservations[0]?.createdAt;

      window.location.assign(`./reservation-history-detail.html?createdAt=${encodeURIComponent(reservationCreatedAt)}&reservationCompleted=true`);
    }
  });

  render();
}
