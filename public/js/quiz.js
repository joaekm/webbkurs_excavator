// Bildfråga (hotspot): registrera klick i bilden som svar (procentkoordinater).
// Endast före inlämning. Efter inlämning renderar servern facit.
document.querySelectorAll("[data-hotspot]").forEach((stage) => {
  if (stage.dataset.submitted === "1") return;
  const qid = stage.dataset.qid;
  const img = stage.querySelector("img");
  const inputX = stage.querySelector(`input[name="${qid}_x"]`);
  const inputY = stage.querySelector(`input[name="${qid}_y"]`);
  if (!img || !inputX || !inputY) return;

  let marker = null;

  img.addEventListener("click", (e) => {
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    inputX.value = x.toFixed(2);
    inputY.value = y.toFixed(2);

    if (!marker) {
      marker = document.createElement("span");
      marker.className = "hotspot-marker";
      stage.appendChild(marker);
    }
    marker.style.left = x + "%";
    marker.style.top = y + "%";
  });
});
