import { renderBottomNavigation } from './components/bottom-navigation.js';
import { createMoreHome } from './features/more/more-home.js';

const bottomNavigationContainer = document.querySelector('[data-component="bottom-navigation"]');

bottomNavigationContainer.innerHTML = renderBottomNavigation('more');
bottomNavigationContainer.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="navigate-reservation"]')) {
    window.location.assign('./index.html');
  }
});
createMoreHome(document.querySelector('.more-home'));
