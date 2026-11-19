/* ASC3ND mobile pocket reader. Desktop react-pageflip is preserved unmodified.
 * Progressive enhancement: reuse the actual hydrated page content, not a second manuscript.
 * Native document scrolling, one readable leaf at a time, tap-safe controls.
 */
(() => {
  "use strict";
  const media = matchMedia("(max-width: 760px), (max-width: 1024px) and (orientation: portrait)");
  const CHAPTERS = [
    ["01", "Where we began", 3], ["02", "The first real system", 6],
    ["03", "What is live today", 8], ["04", "Quiet infrastructure", 11],
    ["05", "What still needs to be done", 13], ["06", "The permanent platform", 16],
  ];
  let pages = [];
  let index = 0;
  let app = null;
  let observer = null;
  let sound = false;
  let modalTrigger = null;

  const folio = (i) => i === 0 ? "Cover" : i === 1 ? "Founders" :
    i >= 21 ? "Back cover" : String(i - 1).padStart(2, "0") + " / 19";

  function paperSound() {
    if (!sound) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      const ctx = new Context(), oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(280, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + .09);
      gain.gain.setValueAtTime(.018, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .1);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + .11);
      oscillator.onended = () => void ctx.close();
    } catch { /* Audio is optional; reading must remain uninterrupted. */ }
  }

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function closeDialogs() {
    const contents = app?.querySelector(".pocket-contents");
    const mediaDialog = app?.querySelector(".pocket-media");
    const wasOpen = !!((contents && !contents.hidden) || (mediaDialog && !mediaDialog.hidden));
    if (contents) contents.hidden = true;
    if (mediaDialog) mediaDialog.hidden = true;
    document.body.classList.remove("pocket-dialog-open");
    if (wasOpen) (modalTrigger || app?.querySelector(".pocket-contents-toggle"))?.focus();
    modalTrigger = null;
  }

  function goTo(next) {
    const bounded = Math.max(0, Math.min(pages.length - 1, next));
    if (bounded === index && app?.querySelector(".pocket-sheet")) return;
    index = bounded;
    const host = app.querySelector(".pocket-sheet-host");
    const leaf = pages[index].cloneNode(true);
    leaf.removeAttribute("style");
    leaf.removeAttribute("data-fit");
    leaf.classList.remove("stf__item", "--soft", "--right", "--simple");
    leaf.classList.add("pocket-sheet");
    for (const nested of leaf.querySelectorAll("[style]")) {
      if (nested.hasAttribute("data-density")) nested.removeAttribute("style");
    }
    host.replaceChildren(leaf);
    app.querySelector(".pocket-folio").textContent = folio(index);
    app.querySelector(".pocket-prev").disabled = index === 0;
    app.querySelector(".pocket-next").disabled = index === pages.length - 1;
    closeDialogs();
    window.scrollTo({ top: 0, behavior: "instant" });
    app.querySelector(".pocket-sheet-host").setAttribute("aria-label", "Book page " + (index + 1) + " of " + pages.length);
    paperSound();
  }

  function render() {
    if (app || !pages.length) return;
    app = make("div", "pocket-app");
    app.id = "asc3nd-pocket-reader";
    const top = make("header", "pocket-bar");
    const logo = make("span", "pocket-wordmark", "ASC3ND");
    const heading = make("span", "pocket-book-label", "Progress book");
    const menu = make("button", "pocket-contents-toggle", "Contents");
    menu.type = "button";
    menu.setAttribute("aria-label", "Open table of contents");
    const soundButton = make("button", "pocket-sound", "Sound off");
    soundButton.type = "button"; soundButton.setAttribute("aria-pressed", "false");
    soundButton.addEventListener("click", () => {
      sound = !sound;
      soundButton.textContent = sound ? "Sound on" : "Sound off";
      soundButton.setAttribute("aria-pressed", String(sound));
    });
    top.append(logo, heading, menu, soundButton);

    const body = make("main", "pocket-sheet-host");
    body.id = "pocket-book-page";
    body.setAttribute("aria-live", "off");
    body.setAttribute("tabindex", "-1");

    const nav = make("nav", "pocket-bottom");
    nav.setAttribute("aria-label", "Book page navigation");
    const prev = make("button", "pocket-prev", "← Previous");
    const next = make("button", "pocket-next", "Next →");
    prev.type = next.type = "button";
    prev.addEventListener("click", () => goTo(index - 1));
    next.addEventListener("click", () => goTo(index + 1));
    const counter = make("span", "pocket-folio", "");
    counter.setAttribute("role", "status");
    nav.append(prev, counter, next);

    const toc = make("div", "pocket-contents");
    toc.hidden = true;
    toc.setAttribute("role", "dialog");
    toc.setAttribute("aria-modal", "true");
    toc.setAttribute("aria-label", "Table of contents");
    const tocPane = make("div", "pocket-contents-panel");
    const tocHead = make("div", "pocket-contents-heading");
    tocHead.append(make("h2", "", "Contents"));
    const dismiss = make("button", "pocket-close", "Close");
    dismiss.addEventListener("click", closeDialogs);
    tocHead.append(dismiss); tocPane.append(tocHead);
    const items = [["—", "Cover", 0], ["—", "Founders", 1], ...CHAPTERS, ["—", "Back cover", 21]];
    for (const [number, label, page] of items) {
      const button = make("button", "pocket-chapter");
      button.type = "button";
      button.append(make("span", "", number), make("strong", "", label));
      button.addEventListener("click", () => goTo(page));
      tocPane.append(button);
    }
    toc.append(tocPane);
    toc.addEventListener("click", (event) => { if (event.target === toc) closeDialogs(); });
    menu.addEventListener("click", () => {
      modalTrigger = menu;
      toc.hidden = false;
      document.body.classList.add("pocket-dialog-open");
      dismiss.focus();
    });

    const mediaDialog = make("div", "pocket-media");
    mediaDialog.hidden = true;
    mediaDialog.setAttribute("role", "dialog");
    mediaDialog.setAttribute("aria-modal", "true");
    mediaDialog.setAttribute("aria-label", "Enlarged book image");
    const mediaClose = make("button", "pocket-media-close", "Close");
    mediaClose.addEventListener("click", closeDialogs);
    const enlarged = document.createElement("img");
    enlarged.alt = "Enlarged book image";
    mediaDialog.append(mediaClose, enlarged);
    mediaDialog.addEventListener("click", (event) => { if (event.target === mediaDialog) closeDialogs(); });
    body.addEventListener("click", (event) => {
      const imageButton = event.target.closest(".campaign-strip button, .editorial-gallery button");
      if (!imageButton) return;
      const img = imageButton.querySelector("img");
      if (!img) return;
      event.preventDefault();
      modalTrigger = imageButton;
      enlarged.src = img.currentSrc || img.src;
      enlarged.alt = img.alt || enlarged.alt;
      mediaDialog.hidden = false;
      document.body.classList.add("pocket-dialog-open");
      mediaClose.focus();
    });
    app.append(top, body, nav, toc, mediaDialog);
    document.body.append(app);
    document.body.classList.add("pocket-active");
    goTo(index);
  }

  function teardown() {
    if (!app) return;
    closeDialogs();
    app.remove();
    app = null;
    document.body.classList.remove("pocket-active", "pocket-dialog-open");
  }

  function check() {
    if (!media.matches) { teardown(); return; }
    if (app) return;
    const source = [...document.querySelectorAll(".reading-room .book-page")];
    if (source.length < 22) return;
    pages = source.slice(0, 22).map(page => page.cloneNode(true));
    observer?.disconnect();
    observer = null;
    render();
  }
  function handleKey(event) {
    if (!app) return;
    if (event.key === "Escape") {
      if (!app.querySelector(".pocket-contents").hidden || !app.querySelector(".pocket-media").hidden) closeDialogs();
      return;
    }
    if (event.key === "ArrowRight" && !event.target.closest("a, button, input, textarea, select")) {
      event.stopImmediatePropagation(); goTo(index + 1);
    }
    if (event.key === "ArrowLeft" && !event.target.closest("a, button, input, textarea, select")) {
      event.stopImmediatePropagation(); goTo(index - 1);
    }
  }
  document.addEventListener("keydown", handleKey, true);
  media.addEventListener("change", () => {
    if (!media.matches) { teardown(); return; }
    if (!observer) observer = new MutationObserver(check);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    check();
  });
  observer = new MutationObserver(check);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  check();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", check, { once: true });
})();