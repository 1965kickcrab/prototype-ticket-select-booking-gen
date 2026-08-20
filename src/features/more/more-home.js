import { getStoredMembers } from '../../storage/member-storage.js';

export function createMoreHome(container) {
  const guardianPhone = container.querySelector('[data-field="guardian-phone"]');
  const [guardian] = getStoredMembers();

  guardianPhone.textContent = guardian?.phoneNumber ?? '010-1234-5678';

  container.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'open-reservations') {
      window.location.assign('./reservation-history.html');
    }

    if (actionTarget.dataset.action === 'open-my-tickets') {
      window.location.assign('./my-tickets.html');
    }

  });
}
