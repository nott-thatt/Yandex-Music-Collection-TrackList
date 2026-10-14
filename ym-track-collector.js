
(() => {
  "use strict";

  const OLD = window.__ymCleanCollector;
  if (OLD?.destroy) OLD.destroy();

  const tracks = new Map();
  const order = [];

  let active = true;
  let observer = null;
  let timer = null;
  let busy = false;

  const normalize = value =>
    String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const cleanTitle = value =>
    normalize(value)
      .replace(/^(?:Трек|Track)\s*[:：-]?\s*/i, "")
      .trim();

  function cleanArtists(values) {
    const names = values
      .flatMap(x => normalize(x).split(/\s*,\s*/))
      .filter(Boolean);

    const seen = new Set();

    return names.filter(name => {
      const key = name.toLocaleLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    }).join(", ");
  }

  function getRow(link) {
    let node = link.parentElement;
    let fallback = node;

    for (let i = 0; node && i < 9; i++) {
      const artistLinks =
        node.querySelectorAll('a[href*="/artist/"]');

      const trackLinks =
        node.querySelectorAll('a[href*="/track/"]');

      if (artistLinks.length && trackLinks.length === 1) {
        return node;
      }

      if (
        node.matches?.(
          '[role="row"],[data-testid*="track"],li'
        )
      ) {
        fallback = node;
      }

      node = node.parentElement;
    }

    return fallback || link.parentElement;
  }

  function extractTrack(link) {
    const href = link.getAttribute("href") || "";
    const match = href.match(/\/track\/(\d+)/);

    if (!match) return null;

    const id = match[1];
    const row = getRow(link);

    const title = cleanTitle(
      normalize(link.textContent) ||
      link.getAttribute("title") ||
      link.getAttribute("aria-label")
    );

    if (!title) return null;

    const artistLinks = [
      ...row.querySelectorAll('a[href*="/artist/"]')
    ];

    let artists = artistLinks
      .map(a => normalize(a.textContent))
      .filter(Boolean);

    if (!artists.length) {
      artists = [
        ...row.querySelectorAll(
          '[data-testid*="artist"],' +
          '[class*="artist"],' +
          '[class*="Artist"]'
        )
      ].map(x => normalize(x.textContent));
    }

    return {
      id,
      artist: cleanArtists(artists),
      title
    };
  }

  // Preserve playlist order using neighbouring tracks.

  function mergeOrder(visibleIds) {
    let previous = null;

    for (let i = 0; i < visibleIds.length; i++) {
      const id = visibleIds[i];

      if (order.includes(id)) {
        previous = id;
        continue;
      }

      let next = null;

      for (let j = i + 1; j < visibleIds.length; j++) {
        if (order.includes(visibleIds[j])) {
          next = visibleIds[j];
          break;
        }
      }

      if (previous && order.includes(previous)) {
        const position = order.indexOf(previous);

        order.splice(position + 1, 0, id);
      } else if (next && order.includes(next)) {
        const position = order.indexOf(next);

        order.splice(position, 0, id);
      } else {
        order.push(id);
      }

      previous = id;
    }
  }

  function collect() {
    if (!active || busy) return;

    busy = true;

    try {
      const links = [
        ...document.querySelectorAll(
          'a[href*="/track/"]'
        )
      ].filter(link => !panel.contains(link));

      const visibleIds = [];
      const seen = new Set();

      for (const link of links) {
        const track = extractTrack(link);

        if (!track || seen.has(track.id)) continue;

        seen.add(track.id);
        visibleIds.push(track.id);

        const old = tracks.get(track.id);

        if (!old) {
          tracks.set(track.id, track);
        } else {
          tracks.set(track.id, {
            ...old,
            artist: old.artist || track.artist,
            title: old.title || track.title
          });
        }
      }

      mergeOrder(visibleIds);
      updateCount();
    } finally {
      busy = false;
    }
  }

  function orderedTracks() {
    return order
      .map(id => tracks.get(id))
      .filter(Boolean);
  }

  function getTXT() {
    return orderedTracks()
      .map(t =>
        `${t.artist ? t.artist + " - " : ""}${t.title}`
      )
      .join("\n");
  }

  function csvCell(value) {
    return '"' +
      String(value || "").replace(/"/g, '""') +
      '"';
  }

  function getCSV() {
    return [
      "Artist,Title",
      ...orderedTracks().map(t =>
        [t.artist, t.title].map(csvCell).join(",")
      )
    ].join("\n");
  }

  function download(content, filename, mime) {
    const blob = new Blob(
      ["\ufeff", content],
      { type: mime + ";charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  // Interface

  const panel = document.createElement("div");

  panel.id = "ym-clean-collector-panel";

  Object.assign(panel.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "285px",
    padding: "18px",
    background: "#151515",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "12px",
    boxShadow: "0 8px 32px #0009",
    zIndex: "2147483647",
    font: "13px system-ui, sans-serif"
  });

  const heading = document.createElement("div");
  heading.textContent = "Yandex Music — Track Export";
  heading.style.fontWeight = "bold";

  const count = document.createElement("div");
  count.style.fontSize = "36px";
  count.style.fontWeight = "bold";
  count.style.margin = "12px 0";

  const status = document.createElement("div");
  status.style.color = "#aaa";
  status.style.marginBottom = "12px";
  status.style.lineHeight = "1.5";

  const buttons = document.createElement("div");

  panel.append(heading, count, status, buttons);
  document.body.appendChild(panel);

  function addButton(label, action, primary = false) {
    const button = document.createElement("button");

    button.textContent = label;

    Object.assign(button.style, {
      display: "block",
      width: "100%",
      marginTop: "8px",
      padding: "10px",
      textAlign: "left",
      background: primary ? "#d0eb75" : "#292929",
      color: primary ? "#111" : "#fff",
      border: "1px solid #555",
      borderRadius: "7px",
      cursor: "pointer"
    });

    button.addEventListener("click", action);
    buttons.appendChild(button);

    return button;
  }

  function updateCount() {
    count.textContent = String(tracks.size);
  }

  function stop() {
    collect();

    active = false;

    observer?.disconnect();
    clearInterval(timer);

    status.textContent =
      "Collection finished. Ready to download.";

    buttons.replaceChildren();

    addButton(
      "Download TXT",
      () => download(
        getTXT(),
        "Yandex Music Collection Tracklist.txt",
        "text/plain"
      ),
      true
    );

    addButton(
      "Download CSV",
      () => download(
        getCSV(),
        "Yandex Music Collection Tracklist.csv",
        "text/csv"
      )
    );
  }

  addButton("Finish Capture", stop, true);

  // Watch dynamically loaded playlist content.

  observer = new MutationObserver(mutations => {
    if (!active || busy) return;

    const changedOutsidePanel = mutations.some(
      mutation =>
        mutation.target !== panel &&
        !panel.contains(mutation.target)
    );

    if (changedOutsidePanel) {
      collect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  timer = setInterval(() => {
    if (active) collect();
  }, 700);

  window.__ymCleanCollector = {
    destroy() {
      active = false;
      observer?.disconnect();
      clearInterval(timer);
      panel.remove();
    },
    getTracks: orderedTracks,
    getTXT,
    getCSV,
    finish: stop
  };

  collect();

  status.textContent =
    "Scroll slowly from top to bottom. " +
    "Tracks will be saved in playlist order.";

  console.log(
    "[YM Track Export] Started.",
    "Scroll from the beginning of the playlist."
  );
})();
