// Interaktivitet på modulsidan och /checklistor: checkrutor, anteckningar, läst.
// Ingen framework — vanilla JS. Fel loggas, kraschar aldrig sidan.

// ---- Checkrutor ------------------------------------------------------------
document.querySelectorAll("input.task-checkbox").forEach((box) => {
  box.addEventListener("change", async () => {
    const slug = box.dataset.slug;
    const index = Number(box.dataset.index);
    const checked = box.checked;
    const li = box.closest("li");
    if (li) li.classList.toggle("done", checked);
    try {
      await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, index, checked }),
      });
    } catch (e) {
      console.warn("Kunde inte spara kryssruta:", e);
    }
  });
  // Sätt initialt done-läge (server sätter checked-attributet).
  const li = box.closest("li");
  if (li && box.checked) li.classList.add("done");
});

// ---- Anteckningar (autospar) ----------------------------------------------
const notes = document.getElementById("notes");
const notesStatus = document.getElementById("notes-status");
if (notes) {
  let timer = null;
  const save = async () => {
    try {
      await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: notes.dataset.slug, body: notes.value }),
      });
      if (notesStatus) {
        const t = new Date().toLocaleTimeString("sv-SE");
        notesStatus.textContent = "Sparat " + t;
      }
    } catch (e) {
      if (notesStatus) notesStatus.textContent = "Kunde inte spara";
      console.warn("Kunde inte spara anteckning:", e);
    }
  };
  notes.addEventListener("input", () => {
    if (notesStatus) notesStatus.textContent = "Sparar…";
    clearTimeout(timer);
    timer = setTimeout(save, 700);
  });
}

// ---- Markera som läst ------------------------------------------------------
const readBtn = document.getElementById("read-toggle");
if (readBtn) {
  readBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: readBtn.dataset.slug }),
      });
      const data = await res.json();
      const read = !!data.read;
      readBtn.dataset.read = read ? "1" : "0";
      readBtn.classList.toggle("read-on", read);
      readBtn.textContent = read ? "✓ Markerad som läst" : "Markera som läst";
    } catch (e) {
      console.warn("Kunde inte uppdatera läst-status:", e);
    }
  });
}
