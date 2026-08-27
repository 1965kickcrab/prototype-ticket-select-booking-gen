import { cancelSchoolReservations } from '../../services/school-reservation.js';
import { getSchoolTicket } from '../../services/school-ticket.js';
import { getStoredMembers } from '../../storage/member-storage.js';
import { getSchoolReservationData } from '../../storage/school-reservation-storage.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getTodayKey() {
  const today = new Date();

  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return `${year}년 ${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})`;
}

function getTicketRoundLabel(reservation, schoolReservationList, petsById) {
  if (!reservation.ticketId) return null;

  const ticketReservations = schoolReservationList
    .filter((item) => item.status === '예약' && item.petId === reservation.petId && item.ticketId === reservation.ticketId)
    .sort((left, right) => (
      left.date.localeCompare(right.date)
      || left.createdAt.localeCompare(right.createdAt)
      || left.id.localeCompare(right.id)
    ));
  const round = ticketReservations.findIndex((item) => item.id === reservation.id) + 1;
  const pet = petsById.get(reservation.petId);
  const ticket = pet ? getSchoolTicket(pet, reservation.ticketId) : null;
  const totalCount = Number(
    reservation.ticketTotalCount
    ?? reservation.ticketSnapshot?.totalCount
    ?? ticket?.totalCount,
  );

  return round > 0 && Number.isFinite(totalCount) && totalCount > 0
    ? `${round}/${totalCount}회차`
    : null;
}

export function createReservationDetail(root) {
  const requestedDate = new URLSearchParams(window.location.search).get('date');
  const state = {
    dateKey: /^\d{4}-\d{2}-\d{2}$/.test(requestedDate ?? '') ? requestedDate : getTodayKey(),
    selectedReservationIds: new Set(),
  };
  const dateLabel = root.querySelector('[data-field="reservation-date"]');
  const selectionAction = root.querySelector('[data-field="selection-action"]');
  const cancellationNotice = root.querySelector('[data-field="cancellation-notice"]');
  const petList = root.querySelector('[data-field="reservation-pet-list"]');
  const emptyMessage = root.querySelector('[data-field="empty-message"]');
  const cancellationFooter = root.querySelector('[data-field="cancellation-footer"]');
  const cancellationButton = root.querySelector('[data-action="cancel-reservations"]');

  function getReservations() {
    const { schoolReservationList } = getSchoolReservationData();

    return schoolReservationList.filter((reservation) => (
      reservation.status === '예약' && reservation.date === state.dateKey
    ));
  }

  function isCancellable() {
    return state.dateKey > getTodayKey();
  }

  function render() {
    const reservations = getReservations();
    const { schoolReservationList } = getSchoolReservationData();
    const petsById = new Map(getStoredMembers().flatMap((member) => member.pets).map((pet) => [pet.id, pet]));
    const cancellable = isCancellable();
    const reservationIds = new Set(reservations.map((reservation) => reservation.id));

    state.selectedReservationIds = new Set(
      [...state.selectedReservationIds].filter((reservationId) => reservationIds.has(reservationId)),
    );
    dateLabel.textContent = formatDate(state.dateKey);
    const canCancelReservations = cancellable && reservations.length > 0;

    cancellationNotice.hidden = !canCancelReservations;
    cancellationFooter.hidden = !canCancelReservations;
    selectionAction.hidden = !canCancelReservations;
    emptyMessage.hidden = reservations.length > 0;

    selectionAction.textContent = state.selectedReservationIds.size === reservations.length ? '전체 해제' : '전체 선택';
    cancellationButton.disabled = state.selectedReservationIds.size === 0;
    petList.innerHTML = reservations.map((reservation) => {
      const isSelected = state.selectedReservationIds.has(reservation.id);
      const ticketRoundLabel = getTicketRoundLabel(reservation, schoolReservationList, petsById);

      return `
        <button class="reservation-pet-card surface-card${isSelected ? ' surface-card--selected' : ''}" type="button" data-action="toggle-reservation" data-reservation-id="${reservation.id}" ${canCancelReservations ? '' : 'disabled'} aria-pressed="${isSelected}">
          <span class="reservation-pet-card__content">
            <strong class="reservation-pet-card__name">${reservation.petName}</strong>
            <span class="reservation-pet-card__ticket">${reservation.ticketId ? (reservation.ticketName ?? '유치원 이용권') : '이용권 미등록'}</span>
            ${ticketRoundLabel ? `<span class="reservation-pet-card__ticket-round">${ticketRoundLabel}</span>` : ''}
          </span>
          ${canCancelReservations ? `<span class="reservation-pet-card__check${isSelected ? ' reservation-pet-card__check--selected' : ''}" aria-hidden="true">${isSelected ? '✓' : ''}</span>` : ''}
        </button>
      `;
    }).join('');
  }

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'go-back') {
      window.location.assign(`index.html?date=${state.dateKey}`);
      return;
    }

    if (actionTarget.dataset.action === 'toggle-reservation') {
      const { reservationId } = actionTarget.dataset;

      if (state.selectedReservationIds.has(reservationId)) state.selectedReservationIds.delete(reservationId);
      else state.selectedReservationIds.add(reservationId);

      render();
    }

    if (actionTarget.dataset.action === 'toggle-all-selection') {
      const reservations = getReservations();

      state.selectedReservationIds = state.selectedReservationIds.size === reservations.length
        ? new Set()
        : new Set(reservations.map((reservation) => reservation.id));
      render();
    }

    if (actionTarget.dataset.action === 'cancel-reservations') {
      if (state.selectedReservationIds.size === 0) return;
      if (!window.confirm(`${state.selectedReservationIds.size}건의 예약을 취소할까요?`)) return;

      const result = cancelSchoolReservations([...state.selectedReservationIds]);

      if (!result.ok) window.alert(result.message);
      else window.location.assign('./index.html?reservationCancelled=true');

      render();
    }
  });

  render();
}
