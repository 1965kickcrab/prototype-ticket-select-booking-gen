import { getMemberPetRows, getStoredMemberTagCatalog, getStoredMembers, processSchoolTicketAttendance } from "../../shared/storage/member-storage.js";
import { getSchoolHomeReservations } from "../../shared/storage/school-home-storage.js";
import { ensureTicketList } from "../../shared/data/ticket-list.js";

export function createMemberHomeState() {
  ensureTicketList();
  const queryParams = new URLSearchParams(window.location.search);
  processSchoolTicketAttendance(getSchoolHomeReservations());

  return {
    members: getStoredMembers(),
    reservations: getSchoolHomeReservations(),
    memberTagCatalog: getStoredMemberTagCatalog(),
    searchTerm: "",
    selectedMemberTagNames: [],
    tagFilterQuery: "",
    memberTagManagementQuery: "",
    currentPage: 1,
    pageSize: 10,
    isFilterPanelOpen: false,
    isTagMenuOpen: false,
    isMemberTagManagementOpen: false,
    openMemberTagMenuTagName: "",
    activeMemberTagSheetTagName: "",
    memberTagSheetDraftName: "",
    isGuardianLookupModalOpen: false,
    isMemberRegistrationPageOpen: false,
    isTicketIssueModalOpen: false,
    ticketIssueMemberId: "",
    ticketIssuePetId: "",
    toastMessage: queryParams.get("toast") === "memberRegistered" ? "회원을 등록했습니다." : "",
    guardianLookup: {
      guardianName: "",
      phoneNumber: "",
      error: "",
    },
  };
}

export function getFilteredMembers(memberHomeState, searchFields) {
  const searchTerm = normalizeSearchText(memberHomeState.searchTerm);
  const selectedMemberTagNames = memberHomeState.selectedMemberTagNames || [];
  let filteredMembers = getMemberPetRows(memberHomeState.members);

  if (searchTerm) {
    filteredMembers = filteredMembers.filter((member) => {
      return searchFields.some((fieldName) => {
        return normalizeSearchText(member[fieldName]).includes(searchTerm);
      });
    });
  }

  if (selectedMemberTagNames.length > 0) {
    filteredMembers = filteredMembers.filter((member) => {
      const memberTagNames = member.petTags || [];
      return selectedMemberTagNames.every((memberTagName) => memberTagNames.includes(memberTagName));
    });
  }

  return filteredMembers;
}

export function getMemberListState(memberHomeState, filteredMembers) {
  if (getMemberPetRows(memberHomeState.members).length === 0) {
    return "empty";
  }

  if (filteredMembers.length === 0) {
    return "searchEmpty";
  }

  return "list";
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}
