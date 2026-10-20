/* ===== Skanky Banks — data & player ===== */

// Edit releases here. `src` / `cover` are paths under assets/.
const RELEASES = [
  {
    title: "Skanky Banks",
    badge: "Album",
    meta: "8 tracks · Ska / Cumbia",
    cover: "assets/img/album-cover.jpg",
    tracks: [
      { title: "Comienzo",                 src: "assets/audio/comienzo.mp3" },
      { title: "Avanzando",                src: "assets/audio/avanzando.mp3" },
      { title: "One For All",              src: "assets/audio/one-for-all.mp3" },
      { title: "Let Me Have Fun",          src: "assets/audio/let-me-have-fun.mp3" },
      { title: "Achtontli",                src: "assets/audio/achtontli.mp3" },
      { title: "Skanky Cumbia",            src: "assets/audio/skanky-cumbia.mp3" },
      { title: "Now",                      src: "assets/audio/now.mp3" },
      { title: "My Essence Keeps Ongoing", src: "assets/audio/my-essence-keeps-ongoing.mp3" },
    ],
  },
  {
    title: "Sin Ti",
    badge: "Single",
    meta: "2 tracks",
    cover: "assets/img/sin-ti-cover.png",
    tracks: [
      { title: "Sin Ti",    src: "assets/audio/sin-ti.mp3" },
      { title: "Anchdubli", src: "assets/audio/anchdubli.mp3" },
    ],
  },
];

// ---- Build a flat playlist so prev/next crosses releases ----
const PLAYLIST = [];
RELEASES.forEach((rel) => {
  rel.tracks.forEach((t) => {
    PLAYLIST.push({ ...t, album: rel.title, cover: rel.cover, index: PLAYLIST.length });
  });
});

const audio = document.getElementById("audio");
let current = -1;

// ---- Render releases ----
const releasesEl = document.getElementById("releases");
let flat = 0;
RELEASES.forEach((rel) => {
  const section = document.createElement("div");
  section.className = "release";

  const rows = rel.tracks
    .map((t, i) => {
      const gi = flat + i;
      return `
        <div class="track" data-i="${gi}">
          <div class="track__num"><span>${i + 1}</span></div>
          <div class="track__play">▶</div>
          <div class="track__title">${escapeHtml(t.title)}</div>
          <div class="track__dur" data-dur="${gi}">–:––</div>
          <a class="track__dl" href="${t.src}" download title="Download ${escapeHtml(t.title)}">⤓</a>
        </div>`;
    })
    .join("");
  flat += rel.tracks.length;

  section.innerHTML = `
    <div class="release__cover">
      <span class="release__badge">${escapeHtml(rel.badge)}</span>
      <img src="${rel.cover}" alt="${escapeHtml(rel.title)} cover" loading="lazy" />
    </div>
    <div class="release__info">
      <h3>${escapeHtml(rel.title)}</h3>
      <p class="release__meta">${escapeHtml(rel.meta)}</p>
      <div class="tracklist">${rows}</div>
    </div>`;
  releasesEl.appendChild(section);
});

// ---- Preload durations ----
PLAYLIST.forEach((t) => {
  const probe = new Audio();
  probe.preload = "metadata";
  probe.src = t.src;
  probe.addEventListener("loadedmetadata", () => {
    const cell = document.querySelector(`.track__dur[data-dur="${t.index}"]`);
    if (cell && isFinite(probe.duration)) cell.textContent = fmt(probe.duration);
  });
});

// ---- Player bar refs ----
const bar = {
  root: document.getElementById("playerbar"),
  art: document.getElementById("pbArt"),
  title: document.getElementById("pbTitle"),
  album: document.getElementById("pbAlbum"),
  play: document.getElementById("pbPlay"),
  prev: document.getElementById("pbPrev"),
  next: document.getElementById("pbNext"),
  progress: document.getElementById("pbProgress"),
  barFill: document.getElementById("pbBar"),
  time: document.getElementById("pbTime"),
};

function loadTrack(i, autoplay = true) {
  if (i < 0 || i >= PLAYLIST.length) return;
  current = i;
  const t = PLAYLIST[i];
  audio.src = t.src;
  bar.art.src = t.cover;
  bar.title.textContent = t.title;
  bar.album.textContent = t.album;
  bar.root.classList.add("is-active");
  bar.root.setAttribute("aria-hidden", "false");
  highlight();
  if (autoplay) audio.play().catch(() => {});
}

function togglePlay() {
  if (current === -1) { loadTrack(0); return; }
  if (audio.paused) audio.play(); else audio.pause();
}

function highlight() {
  document.querySelectorAll(".track").forEach((el) => {
    const on = Number(el.dataset.i) === current;
    el.classList.toggle("is-playing", on);
    el.querySelector(".track__play").textContent = on && !audio.paused ? "❚❚" : "▶";
  });
}

// ---- Events ----
document.querySelectorAll(".track").forEach((el) => {
  el.addEventListener("click", (e) => {
    if (e.target.closest(".track__dl")) return; // let download link work
    const i = Number(el.dataset.i);
    if (i === current) togglePlay(); else loadTrack(i);
  });
});

bar.play.addEventListener("click", togglePlay);
bar.prev.addEventListener("click", () => loadTrack(current <= 0 ? PLAYLIST.length - 1 : current - 1));
bar.next.addEventListener("click", () => loadTrack((current + 1) % PLAYLIST.length));

audio.addEventListener("play", () => { bar.play.textContent = "❚❚"; highlight(); });
audio.addEventListener("pause", () => { bar.play.textContent = "▶"; highlight(); });
audio.addEventListener("ended", () => loadTrack((current + 1) % PLAYLIST.length));
audio.addEventListener("timeupdate", () => {
  const d = audio.duration || 0;
  bar.barFill.style.width = d ? `${(audio.currentTime / d) * 100}%` : "0%";
  bar.time.textContent = `${fmt(audio.currentTime)} / ${fmt(d)}`;
});

bar.progress.addEventListener("click", (e) => {
  const r = bar.progress.getBoundingClientRect();
  if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
});

// ---- Mobile nav ----
const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".nav__links");
navToggle.addEventListener("click", () => navLinks.classList.toggle("is-open"));
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("is-open")));

// ---- Helpers ----
function fmt(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

document.getElementById("year").textContent = new Date().getFullYear();
