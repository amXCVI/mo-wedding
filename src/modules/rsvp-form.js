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
  const name = form.elements.name.value.trim();
  const attendance = form.elements.attendance.value;
  const nameError = form.querySelector('[data-error-for="name"]');
  const attendanceError = form.querySelector('[data-error-for="attendance"]');

  nameError.textContent = name ? "" : "Пожалуйста, укажите имя и фамилию.";
  attendanceError.textContent = attendance ? "" : "Выберите один из вариантов.";

  return Boolean(name && attendance);
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
      name: form.elements.name.value.trim(),
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
