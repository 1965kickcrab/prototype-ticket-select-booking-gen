import { createDefaultAppBottomNavigation } from "../../shared/components/navigation.js";
import { createElement } from "../../shared/utils/dom.js";

const PROFILE_IMAGE_PATH = "../assets/defaultProfile_dog.svg";
const TICKET_ICON_PATH = "../assets/menuIcon_ticket_on.svg";
const TAG_ICON_PATH = "../assets/menuIcon_setting.svg";
const CHEVRON_RIGHT_ICON_PATH = "../assets/iconChevronRight.svg";

export function renderAppMoreScreen(rootElement) {
  rootElement.innerHTML = "";
  rootElement.append(createAppMoreScreen());
}

function createAppMoreScreen() {
  const screen = createElement("main", {
    className: "app-more-screen",
    dataset: { screen: "appMore" },
  });

  screen.append(createAppMoreContent());
  screen.append(createDefaultAppBottomNavigation({ selectedLabel: "더보기" }));

  return screen;
}

function createAppMoreContent() {
  const content = createElement("section", {
    className: "app-more-content",
    dataset: { area: "appMoreContent" },
  });
  content.append(createTopActionBar());
  content.append(createProfileSection());
  content.append(createQuickMenuGrid());
  content.append(createSupportMenuSection());
  content.append(createPolicyMenuSection());
  content.append(createLogoutButton());
  return content;
}

function createTopActionBar() {
  const bar = createElement("header", { className: "app-more-topbar" });
  const alarmButton = createElement("button", {
    className: "app-more-alarm-button",
    type: "button",
    ariaLabel: "알림",
    dataset: { action: "openNotifications" },
  });
  alarmButton.append(createElement("span", { className: "app-more-alarm-icon", textContent: "" }));
  bar.append(alarmButton);
  return bar;
}

function createProfileSection() {
  const section = createElement("section", {
    className: "app-more-profile",
    dataset: { area: "profileSummary" },
  });
  const avatar = createElement("div", { className: "app-more-profile-avatar" });
  avatar.append(createElement("img", { src: PROFILE_IMAGE_PATH, alt: "" }));
  section.append(avatar);

  const text = createElement("div", { className: "app-more-profile-text" });
  text.append(createElement("span", { textContent: "아이디" }));
  text.append(createElement("strong", { textContent: "wldnjs596" }));
  section.append(text);
  return section;
}

function createQuickMenuGrid() {
  const grid = createElement("section", {
    className: "app-more-quick-grid",
    dataset: { area: "quickMenu" },
  });
  grid.append(createQuickMenuButton({
    label: "이용권",
    iconSrc: TICKET_ICON_PATH,
    action: "openTickets",
  }));
  grid.append(createQuickMenuButton({
    label: "태그",
    iconSrc: TAG_ICON_PATH,
    action: "openTags",
  }));
  return grid;
}

function createQuickMenuButton(options) {
  const button = createElement("button", {
    className: "app-more-quick-button",
    type: "button",
    dataset: { action: options.action },
  });
  button.append(createElement("img", { src: options.iconSrc, alt: "" }));
  button.append(createElement("span", { textContent: options.label }));

  if (options.href) {
    button.addEventListener("click", () => {
      window.location.href = options.href;
    });
  }

  return button;
}

function createSupportMenuSection() {
  return createMenuSection([
    { label: "자주 묻는 질문" },
    { label: "전화 문의" },
    { label: "카톡 문의" },
  ]);
}

function createPolicyMenuSection() {
  return createMenuSection([
    { label: "공지사항 & 새소식" },
    { label: "개인정보 처리 방침" },
    { label: "서비스 이용 약관" },
  ]);
}

function createMenuSection(items) {
  const section = createElement("section", {
    className: "app-more-menu-section",
    dataset: { area: "moreMenuList" },
  });

  items.forEach((item) => {
    section.append(createMenuRow(item.label));
  });

  return section;
}

function createMenuRow(label) {
  const row = createElement("button", {
    className: "app-more-menu-row",
    type: "button",
    textContent: label,
    dataset: { action: "openMoreMenu", target: label },
  });
  row.append(createElement("img", { src: CHEVRON_RIGHT_ICON_PATH, alt: "" }));
  return row;
}

function createLogoutButton() {
  return createElement("button", {
    className: "app-more-logout-button",
    type: "button",
    textContent: "로그아웃",
    dataset: { action: "logout" },
  });
}
