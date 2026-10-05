import { wedding } from "../config.js";

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export function initCountdown() {
  const root = document.querySelector("[data-countdown]");
  const todayMessage = document.querySelector("[data-countdown-today]");

  if (!root || !todayMessage) return;

  const nodes = {
    days: root.querySelector("[data-days]"),
    hours: root.querySelector("[data-hours]"),
    minutes: root.querySelector("[data-minutes]"),
    seconds: root.querySelector("[data-seconds]"),
  };
  const target = new Date(wedding.date).getTime();

  const render = () => {
    const distance = target - Date.now();

    if (distance <= 0) {
      root.hidden = true;
      todayMessage.hidden = false;
      return false;
    }

    nodes.days.textContent = String(Math.floor(distance / DAY)).padStart(
      2,
      "0",
    );
    nodes.hours.textContent = String(
      Math.floor((distance % DAY) / HOUR),
    ).padStart(2, "0");
    nodes.minutes.textContent = String(
      Math.floor((distance % HOUR) / MINUTE),
    ).padStart(2, "0");
    nodes.seconds.textContent = String(
      Math.floor((distance % MINUTE) / SECOND),
    ).padStart(2, "0");
    return true;
  };

  if (!render()) return;
  const timer = window.setInterval(() => {
    if (!render()) window.clearInterval(timer);
  }, SECOND);
}
