import { renderBottomNavigation } from './components/bottom-navigation.js';
import { createReservationHome } from './features/reservation/reservation-home.js';

const bottomNavigationContainer = document.querySelector('[data-component="bottom-navigation"]');
const reservationHome = document.querySelector('.reservation-home');

bottomNavigationContainer.innerHTML = renderBottomNavigation('reservation');
bottomNavigationContainer.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="navigate-more"]')) {
    window.location.assign('./more.html');
  }
});
createReservationHome(reservationHome);
