// site: everything on the page that is a picture is drawn here, in the browser, as the page loads.
// - the four plates: kit/plates.js, a Worker running the same drawing code that made them, from pele's marks
//   (data/<plate>.marks.json); one plate at a time, as it comes near the screen;
// - pele's own layout of each diagram: pele, run live on the Mermaid text (src/<name>.mmd);
// - each plate with pele's shapes over it in blue, once the plate is drawn;
// - the burger sheet: the film's own code, in an iframe (burger/film.html?render&sheet).
'use strict';
const PLATES = { wind: 'd2-wind', vesper: 'd3-vesper', thunder: 'd4-thunder', comet: 'd5-comet' };
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const marks = {}, getMarks = (n) => marks[n] ??= fetch(`data/${PLATES[n]}.marks.json`).then((r) => r.text());
const done = {}, whenDone = {};
for (const n of Object.keys(PLATES)) done[n] = new Promise((r) => (whenDone[n] = r));

// the plates, drawn one after another by one worker
const worker = new Worker('kit/plates.js');
const queue = [], cvs = {}, t0s = {};
let busy = null;
function draw(n) { if (!queue.includes(n) && !(n in t0s)) { queue.push(n); pump() } }
async function pump() {
  if (busy || !queue.length) return;
  busy = queue.shift(); t0s[busy] = performance.now();
  status(busy, 'Drawing in your browser…');
  worker.postMessage({ name: PLATES[busy], marks: await getMarks(busy), live: !still });
}
const nameOf = (plate) => Object.keys(PLATES).find((k) => PLATES[k] === plate);
worker.onmessage = (e) => {
  const m = e.data, n = nameOf(m.name), cv = cvs[n];
  if (m.type === 'error') { status(n, 'This plate could not be drawn here.'); console.error(m.message); busy = null; pump(); return }
  if (cv.width !== m.w) { cv.width = m.w; cv.height = m.h }
  cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(m.buf), m.w, m.h), 0, 0);
  if (m.type === 'done') {
    status(n, `Drawn in your browser in ${(m.ms / 1000).toFixed(1)} s.`);
    cv.closest('figure').querySelector('.save').hidden = false;
    whenDone[n](); busy = null; pump();
  }
};
const status = (n, t) => { const s = document.querySelector(`[data-status="${n}"]`); if (s) s.textContent = t };
const near = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { draw(e.target.dataset.plate); near.unobserve(e.target) } }, { rootMargin: '150% 0px' });
for (const cv of document.querySelectorAll('canvas[data-plate]')) { cvs[cv.dataset.plate] = cv; near.observe(cv) }

// save a drawn plate as a PNG
document.addEventListener('click', (e) => {
  const b = e.target.closest('.save'); if (!b) return;
  const n = b.dataset.save;
  cvs[n].toBlob((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = PLATES[n] + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) }, 'image/png');
});

// how they were made: pele's layout, live, and pele's shapes over the finished plate
const how = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { made(e.target.dataset.made); how.unobserve(e.target) } }, { rootMargin: '100% 0px' });
for (const el of document.querySelectorAll('[data-made]')) how.observe(el);
async function made(n) {
  const src = await (await fetch(`src/${n}.mmd`)).text(), box = document.querySelector(`[data-pele="${n}"]`);
  try { box.innerHTML = pele.render(src, { responsive: false, fontSize: 16, padding: 12 }).svg } catch (err) { box.textContent = 'pele could not lay this out here.' }
  const svg = box.querySelector('svg'); if (svg) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', box.dataset.label) }
  draw(n); await done[n];
  const M = JSON.parse(await getMarks(n)).marks, ov = document.querySelector(`canvas[data-over="${n}"]`), W = ov.width, k = W / 2048, g = ov.getContext('2d');
  g.imageSmoothingQuality = 'high'; g.drawImage(cvs[n], 0, 0, W, W); g.fillStyle = 'rgba(255,255,255,.62)'; g.fillRect(0, 0, W, W);
  g.strokeStyle = '#1b4fd1'; g.fillStyle = 'rgba(27,79,209,.10)'; g.lineWidth = 2.2 * W / 1024; g.lineJoin = g.lineCap = 'round';
  // shapes only: the plate letters its words where they fit best, and pele's legend and label backings weren't drawn
  for (const m of M) {
    if (!m.P || m.P.length < 2 || m.tag === 'text' || m.cls.includes('pele-legend') || m.cls.includes('pele-edge-label')) continue;
    g.beginPath(); g.moveTo(m.P[0][0] * k, m.P[0][1] * k); for (const q of m.P.slice(1)) g.lineTo(q[0] * k, q[1] * k); if (m.closed) { g.closePath(); g.fill() } g.stroke();
  }
}

// the burger sheet: the film's code draws it inside its frame and says how big it is
addEventListener('message', (e) => {
  const f = document.querySelector('iframe.burger'); if (!f || e.source !== f.contentWindow || !e.data) return;
  if (e.data.burger === 'size') f.style.aspectRatio = `${e.data.w} / ${e.data.h}`;
  if (e.data.burger === 'done') status('burger', `Drawn in your browser in ${(e.data.ms / 1000).toFixed(1)} s.`);
});
