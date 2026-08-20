import { getStoredMembers } from '../../storage/member-storage.js';
import { getSchoolReservationData } from '../../storage/school-reservation-storage.js';
import { getSchoolTicket, getSchoolTickets, getTicketReservableCount } from '../../services/school-ticket.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return `${year}년 ${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})`;
}

function formatPrice(price) {
  return `${Number(price ?? 0).toLocaleString('ko-KR')}원`;
}

export function createTicketHistory(root) {
  const ticketName = root.querySelector('[data-field="ticket-name"]');
  const ticketMeta = root.querySelector('[data-field="ticket-meta"]');
  const availabilityNotice = root.querySelector('[data-field="availability-notice"]');
  const panel = root.querySelector('[data-field="ticket-panel"]');
  const requestedPetId = new URLSearchParams(window.location.search).get('petId');
  const requestedTicketId = new URLSearchParams(window.location.search).get('ticketId');
  const [guardian] = getStoredMembers();
  const pet = guardian?.pets.find((item) => item.id === requestedPetId) ?? guardian?.pets[0];
  const ticket = pet
    ? getSchoolTicket(pet, requestedTicketId) ?? getSchoolTickets(pet)[0]
    : null;
  let selectedTab = 'status';

  function render() {
    if (!pet || !ticket) {
      availabilityNotice.textContent = '이용권 정보를 찾을 수 없습니다.';
      return;
    }

    const remaining = getTicketReservableCount(ticket);
    const ticketState = remaining > 0 ? '이용 중' : '횟수 소진';
    const { schoolReservationList } = getSchoolReservationData();
    const usageHistory = schoolReservationList
      .filter((reservation) => (
        reservation.memberId === guardian.id
        && reservation.petId === pet.id
        && reservation.ticketId === ticket.id
      ))
      .sort((left, right) => right.date.localeCompare(left.date));

    availabilityNotice.textContent = `[${ticketState}] 예약 가능 ${remaining}회`;
    availabilityNotice.dataset.state = remaining > 0 ? 'available' : 'unavailable';
    ticketName.textContent = ticket.name;
    ticketMeta.textContent = `${ticket.totalCount}회 / ${ticket.validityDays}일 / ${formatPrice(ticket.price)}`;

    root.querySelectorAll('[data-action="select-tab"]').forEach((tab) => {
      const isSelected = tab.dataset.entityId === selectedTab;
      tab.setAttribute('aria-selected', String(isSelected));
    });

    panel.innerHTML = selectedTab === 'status' ? `
      <section class="ticket-information" aria-labelledby="ticket-basic-title">
        <h2 class="ticket-information__title section-title" id="ticket-basic-title">기본 정보</h2>
        <dl class="ticket-information__list">
          <dt>지급처</dt><dd>다이얼독 유치원</dd>
          <dt>반려견</dt><dd>${pet.petName}</dd>
        </dl>
        <h2 class="ticket-information__title section-title">이용권 상태</h2>
        <dl class="ticket-information__list">
          <dt>지급일</dt><dd>${formatDate(ticket.issuedDate)}</dd>
          <dt>개시일</dt><dd>${formatDate(ticket.startDate)}</dd>
          <dt>만료일</dt><dd>${formatDate(ticket.expiryDate)}</dd>
          <dt>예약 가능 날짜</dt><dd>${formatDate(ticket.startDate)} 이후</dd>
        </dl>
      </section>
    ` : `
      <section class="ticket-usage" aria-labelledby="ticket-usage-title">
        <h2 class="ticket-usage__title section-title" id="ticket-usage-title">사용 내역</h2>
        <div class="ticket-usage__list">
          ${usageHistory.length ? usageHistory.map((reservation) => `
            <article class="ticket-usage-item surface-card" data-state="${reservation.status === '취소' ? 'cancelled' : 'confirmed'}">
              <strong class="ticket-usage-item__business">${reservation.businessName ?? '다이얼독 유치원'}</strong>
              <span class="ticket-usage-item__date">${formatDate(reservation.date)}</span>
              ${reservation.status === '취소' ? '<span class="ticket-usage-item__state">취소</span>' : ''}
            </article>
          `).join('') : '<p class="ticket-usage__empty empty-state">사용 내역이 없습니다.</p>'}
        </div>
      </section>
    `;
  }

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (actionTarget?.dataset.action === 'go-back') window.location.assign('./my-tickets.html');

    if (actionTarget?.dataset.action === 'select-tab') {
      selectedTab = actionTarget.dataset.entityId;
      render();
    }
  });

  render();
}
