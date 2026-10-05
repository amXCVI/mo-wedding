const messages = {
  idle: "",
  loading: "Отправляем ваш ответ…",
  success: "Спасибо! Ваш ответ получен.",
  demo: "Спасибо! Ответ сохранён в демо-режиме.",
  error: "Не удалось отправить ответ. Пожалуйста, попробуйте ещё раз.",
};

function setStatus(node, state) {
  node.textContent = messages[state];
  node.dataset.state = state;
}

function validate(form) {
  const names = form.elements.names.value.trim();
  const guestCountValue = form.elements.guestCount.value;
  const guestCount = Number(guestCountValue);
  const attendance = form.elements.attendance.value;
  const namesError = form.querySelector('[data-error-for="names"]');
  const guestCountError = form.querySelector(
    '[data-error-for="guestCount"]',
  );
  const attendanceError = form.querySelector('[data-error-for="attendance"]');

  const isGuestCountValid =
    guestCountValue !== "" &&
    Number.isInteger(guestCount) &&
    guestCount >= 1 &&
    guestCount <= 50;

  namesError.textContent = names ? "" : "Пожалуйста, укажите имена гостей.";
  guestCountError.textContent = isGuestCountValid
    ? ""
    : "Укажите количество гостей от 1 до 50.";
  attendanceError.textContent = attendance ? "" : "Выберите один из вариантов.";

  return Boolean(names && isGuestCountValid && attendance);
}

async function sendResponse(payload) {
  const isLocalPreview =
    import.meta.env?.DEV ??
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (isLocalPreview) {
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    localStorage.setItem("wedding-rsvp-preview", JSON.stringify(payload));
    return { demo: true };
  }

  const response = await fetch("/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`RSVP request failed: ${response.status}`);
  return response.json();
}

export function initRsvpForm() {
  const form = document.querySelector("[data-rsvp-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const button = form.querySelector('button[type="submit"]');
  const startedAt = form.querySelector("[data-started-at]");
  startedAt.value = String(Date.now());

  form.addEventListener("input", () => {
    validate(form);
    if (status.dataset.state === "error") setStatus(status, "idle");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate(form)) return;

    const payload = {
      names: form.elements.names.value.trim(),
      guestCount: Number(form.elements.guestCount.value),
      attendance: form.elements.attendance.value,
      website: form.elements.website.value,
      startedAt: Number(form.elements.startedAt.value),
    };

    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    setStatus(status, "loading");

    try {
      const result = await sendResponse(payload);
      setStatus(status, result.demo ? "demo" : "success");
      form.reset();
      startedAt.value = String(Date.now());
    } catch (error) {
      console.error(error);
      setStatus(status, "error");
    } finally {
      button.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
}
