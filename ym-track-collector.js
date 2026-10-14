
(() => {
  "use strict";

  window.__ymCleanCollector?.destroy?.();

  const tracks = new Map();
  const order = [];
  const rowKeys = new WeakMap();
  let nextLocalId = 1;
  let active = true;
  let busy = false;
  let observer;
  let timer;

  const normalize = value => String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cleanTitle = value => normalize(value)
    .replace(/^(?:Трек|Track)\s*[:：-]?\s*/i, "")
    .trim();

  const cleanArtists = values => {
    const seen = new Set();

    return values
      .flatMap(value =>
        normalize(value).split(/\s*,\s*/)
      )
      .filter(name => {
        if (!name) return false;

        const key = name.toLocaleLowerCase();

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .join(", ");
  };

  // Interface

  const panel = document.createElement("div");
  panel.id = "ym-track-export-panel";

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
  count.style.cssText =
    "font-size:36px;font-weight:bold;margin:12px 0";

  const status = document.createElement("div");
  status.style.cssText =
    "color:#aaa;margin-bottom:12px;line-height:1.5";

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
  }

  // Track extraction

  function extract(row) {
    const titleNode = row.querySelector(
      '[class*="Meta_title"]'
    );

    const artistsNode = row.querySelector(
      '[class*="Meta_artists"]'
    );

    const trackLink = row.querySelector(
      'a[href*="/track/"]'
    );

    const id = trackLink
      ?.getAttribute("href")
      ?.match(/\/track\/(\d+)/)?.[1];

    const image = row.querySelector(
      'img[alt^="Трек "],img[alt^="Track "]'
    );

    const rawTitle = cleanTitle(
      titleNode?.textContent ||
      trackLink?.textContent ||
      image?.getAttribute("alt") ||
      ""
    );

    if (!rawTitle) return null;

    let title = rawTitle;

    let artist = cleanArtists([
      ...(artistsNode
        ? [artistsNode.textContent]
        : []),

      ...(!artistsNode
        ? [...row.querySelectorAll(
            'a[href*="/artist/"]'
          )].map(a => a.textContent)
        : [])
    ]);

    // Handle unavailable MP3 tracks.

    if (!artist && /\.mp3$/i.test(title)) {
      const withoutExt = title
        .replace(/\.mp3$/i, "")
        .trim();

      const divider = withoutExt.indexOf(" - ");

      if (
        divider > 0 &&
        divider < withoutExt.length - 3
      ) {
        artist = withoutExt
          .slice(0, divider)
          .trim();

        title = withoutExt
          .slice(divider + 3)
          .trim();
      } else {
        title = withoutExt;
      }
    }

    // Catalog tracks use their track ID.
    // Unavailable tracks use a local row ID.

    let key;

    if (id) {
      key = `track:${id}`;
    } else {
      const fingerprint = `${artist}\u0000${title}`;
      const cached = rowKeys.get(row);

      if (
        cached &&
        cached.fingerprint === fingerprint
      ) {
        key = cached.key;
      } else {
        key = `unavailable:${nextLocalId++}`;

        rowKeys.set(row, {
          key,
          fingerprint
        });
      }
    }

    return { key, artist, title };
  }

  // Preserve playlist order.

  function mergeOrder(ids) {
    let previous = null;

    for (let i = 0; i < ids.length; i++) {
      const key = ids[i];

      if (order.includes(key)) {
        previous = key;
        continue;
      }

      let next = null;

      for (let j = i + 1; j < ids.length; j++) {
        if (order.includes(ids[j])) {
          next = ids[j];
          break;
        }
      }

      if (previous && order.includes(previous)) {
        order.splice(
          order.indexOf(previous) + 1,
          0,
          key
        );
      } else if (next) {
        order.splice(order.indexOf(next), 0, key);
      } else {
        order.push(key);
      }

      previous = key;
    }
  }

  // Collect tracks.

  function collect() {
    if (!active || busy) return;

    busy = true;

    try {
      const rows = [
        ...document.querySelectorAll(
          '[class*="CommonTrack_root"]'
        )
      ].filter(row => !panel.contains(row));

      const ids = [];
      const seen = new Set();

      for (const row of rows) {
        const item = extract(row);

        if (!item || seen.has(item.key)) continue;

        seen.add(item.key);
        ids.push(item.key);

        const old = tracks.get(item.key);

        tracks.set(
          item.key,
          old
            ? {
                ...item,
                artist: item.artist || old.artist,
                title: item.title || old.title
              }
            : item
        );
      }

      mergeOrder(ids);

      count.textContent = String(tracks.size);
    } finally {
      busy = false;
    }
  }

  function orderedTracks() {
    return order
      .map(key => tracks.get(key))
      .filter(Boolean);
  }

  // Export TXT and CSV.

  function getTXT() {
    return orderedTracks()
      .map(t =>
        `${t.artist ? `${t.artist} - ` : ""}${t.title}`
      )
      .join("\n");
  }

  function csvCell(value) {
    return '"' +
      String(value ?? "").replace(/"/g, '""') +
      '"';
  }

  function getCSV() {
    return [
      "Artist,Title",

      ...orderedTracks().map(t =>
        [t.artist, t.title]
          .map(csvCell)
          .join(",")
      )
    ].join("\n");
  }

  function download(content, filename, type) {
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff", content],
        { type: `${type};charset=utf-8` }
      )
    );

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      3000
    );
  }

  // Finish and download.

  function finish() {
    if (!active) return;

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

  addButton("Finish Capture", finish, true);

  status.textContent =
    "Scroll from top to bottom to collect all tracks, " +
    "including unavailable ones.";

  observer = new MutationObserver(mutations => {
    if (
      mutations.some(m =>
        m.target !== panel &&
        !panel.contains(m.target)
      )
    ) {
      collect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  timer = setInterval(collect, 700);

  window.__ymCleanCollector = {
    destroy() {
      active = false;
      observer?.disconnect();
      clearInterval(timer);
      panel.remove();
    },
    finish,
    getTracks: orderedTracks,
    getTXT,
    getCSV
  };

  collect();

  console.log(
    "[YM Track Export] Started — including unavailable tracks."
  );
})();
