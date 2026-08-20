import { createReservationForm } from './features/reservation/reservation-form.js';

const reservationForm = document.querySelector('.reservation-form');

createReservationForm(reservationForm, {
  onClose: () => {
    window.location.assign('./index.html');
  },
});
