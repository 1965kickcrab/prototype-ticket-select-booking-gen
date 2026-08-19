import { createElement } from "../utils/dom.js";

const HEADER_ICON_PATHS = {
  back: "../assets/iconChevronLeft.svg",
  close: "../assets/iconClose.svg",
};

export function createHeaderIconButton({ className, icon, ariaLabel, dataset }) {
  const button = createElement("button", {
    className,
    type: "button",
    ariaLabel,
    dataset,
  });

  button.append(createElement("img", {
    className: "button__icon",
    src: HEADER_ICON_PATHS[icon],
    alt: "",
  }));
  return button;
}
