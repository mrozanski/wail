(function initWailReader(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-wail-section-id]"));
  const mapItems = new Map<string, HTMLElement>();
  for (const el of document.querySelectorAll<HTMLElement>("[data-wail-map-for]")) {
    const id = el.getAttribute("data-wail-map-for");
    if (id) mapItems.set(id, el);
  }
  const annotations = new Map<string, HTMLElement>();
  for (const el of document.querySelectorAll<HTMLElement>("[data-wail-annotation-for]")) {
    const id = el.getAttribute("data-wail-annotation-for");
    if (id) annotations.set(id, el);
  }

  const intersecting = new Set<string>();
  let activeId: string | null = null;

  function setActive(id: string | null): void {
    if (id === activeId) return;
    if (activeId !== null) {
      mapItems.get(activeId)?.classList.remove("is-active");
      annotations.get(activeId)?.classList.remove("is-active");
    }
    activeId = id;
    if (id !== null) {
      mapItems.get(id)?.classList.add("is-active");
      annotations.get(id)?.classList.add("is-active");
    }
  }

  function pickActive(): void {
    for (const section of sections) {
      const id = section.getAttribute("data-wail-section-id");
      if (id && intersecting.has(id)) {
        setActive(id);
        return;
      }
    }
    setActive(null);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.getAttribute("data-wail-section-id");
        if (!id) continue;
        if (entry.isIntersecting) {
          intersecting.add(id);
        } else {
          intersecting.delete(id);
        }
      }
      pickActive();
    },
    { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
  );

  for (const section of sections) observer.observe(section);

  const drawerToggle = document.querySelector<HTMLElement>("[data-wail-drawer-toggle]");
  const margin = document.querySelector<HTMLElement>(".wail-margin");
  drawerToggle?.addEventListener("click", () => {
    margin?.classList.toggle("is-open");
  });
})();
