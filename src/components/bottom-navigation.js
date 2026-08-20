export function renderBottomNavigation(activeItem = 'reservation') {
  const reservationState = activeItem === 'reservation' ? ' bottom-navigation__item--active' : '';
  const reportState = activeItem === 'report' ? ' bottom-navigation__item--active' : '';
  const moreState = activeItem === 'more' ? ' bottom-navigation__item--active' : '';
  const reservationCurrent = activeItem === 'reservation' ? ' aria-current="page"' : '';
  const reportCurrent = activeItem === 'report' ? ' aria-current="page"' : '';
  const moreCurrent = activeItem === 'more' ? ' aria-current="page"' : '';

  return `
    <nav class="bottom-navigation" aria-label="주요 메뉴">
      <span class="bottom-navigation__item${reservationState}" data-action="navigate-reservation"${reservationCurrent}>
        <span class="bottom-navigation__label">예약</span>
      </span>
      <span class="bottom-navigation__item${reportState}"${reportCurrent}>
        <span class="bottom-navigation__label">알림장</span>
      </span>
      <span class="bottom-navigation__item${moreState}" data-action="navigate-more"${moreCurrent}>
        <span class="bottom-navigation__label">더보기</span>
      </span>
    </nav>
  `;
}
