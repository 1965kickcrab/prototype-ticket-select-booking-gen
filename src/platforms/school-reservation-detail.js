import { renderSchoolReservationDetail } from "../features/school-reservation-detail/school-reservation-detail-renderer.js";

const reservationId = new URLSearchParams(window.location.search).get("reservationId");
renderSchoolReservationDetail(document.querySelector("#app"), reservationId);
