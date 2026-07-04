// Interaktiv bildgenomgång: koppla ihop regioner i bilden med legendraderna.
// Klick eller hover markerar motsvarande region + rad.
document.querySelectorAll("[data-bildgenomgang]").forEach((fig) => {
  const regions = fig.querySelectorAll(".bg-region");
  const legend = fig.querySelectorAll(".bg-legend li");

  const setActive = (idx, on) => {
    regions.forEach((r) => {
      if (Number(r.dataset.region) === idx) r.classList.toggle("active", on);
    });
    legend.forEach((l) => {
      if (Number(l.dataset.region) === idx) l.classList.toggle("active", on);
    });
  };

  const bind = (el) => {
    const idx = Number(el.dataset.region);
    el.addEventListener("mouseenter", () => setActive(idx, true));
    el.addEventListener("mouseleave", () => setActive(idx, false));
    el.addEventListener("click", (e) => {
      e.preventDefault();
      // Toggla "fastlåst" markering via en klass på figuren per index.
      const active = el.classList.contains("locked");
      regions.forEach((r) => r.classList.remove("locked", "active"));
      legend.forEach((l) => l.classList.remove("active"));
      if (!active) {
        setActive(idx, true);
        el.classList.add("locked");
      }
    });
  };

  regions.forEach(bind);
  legend.forEach(bind);
});
