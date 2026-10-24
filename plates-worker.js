// plates-worker: draws one plate in a Worker, with the very code that drew it in Node (../fourdiagrams: the oav
// kit, the hand lettering, the sheet), bundled by build.mjs into kit/plates.js ahead of this file as MODS.
//   postMessage({ name: 'd3-vesper', marks: '<pele marks json>', live: true })
//   → { type: 'frame', name, w, h, buf } now and then while it draws (when live), then { type: 'done', name, w, h, buf, ms }
// Node's fs, path and canvas are stood in for: the sheet reads pele's marks from a little in-memory file system,
// and its PNG writing becomes a message back to the page.
'use strict';
const VFS = {};
const norm = (p) => { const o = []; for (const s of String(p).split('/')) { if (!s || s === '.') continue; if (s === '..') o.pop(); else o.push(s) } return '/' + o.join('/') };
const dirname = (p) => p.slice(0, p.lastIndexOf('/')) || '/';
const BUILTIN = {
  fs: {
    existsSync: (p) => norm(p) in VFS,
    readFileSync: (p) => { const k = norm(p); if (!(k in VFS)) throw new Error('no file ' + k); return VFS[k] },
    writeFileSync() {}, mkdirSync() {},
  },
  path: { join: (...a) => norm(a.join('/')), resolve: (...a) => norm(a.join('/')), dirname, basename: (p) => p.slice(p.lastIndexOf('/') + 1) },
  '@napi-rs/canvas': { createCanvas: (w, h) => new OffscreenCanvas(w, h), ImageData: self.ImageData },
  v8: { setFlagsFromString() {} }, vm: { runInNewContext: () => null },
};
self.process = { env: {}, argv: [], cwd: () => '/', memoryUsage: () => ({ rss: 0 }) };
function load(cache, id, from) {
  if (BUILTIN[id]) return BUILTIN[id];
  const base = norm((id.startsWith('/') ? '' : dirname(from) + '/') + id), f = [base, base + '.js', base + '.json', base + '/index.js'].find((k) => MODS[k]);
  if (!f) throw new Error(`cannot find ${id} (from ${from})`);
  if (cache[f]) return cache[f].exports;
  const module = cache[f] = { exports: {} };
  MODS[f](module, module.exports, (i) => load(cache, i, f), f, dirname(f));
  return module.exports;
}
// the drawing as RGBA, from the kit's own paper-and-pigment buffer (what toCanvas does in Node)
function pixels(S) {
  const n = S.W * S.H, buf = new Uint8ClampedArray(n * 4), rgb = S.rgb;
  for (let i = 0; i < n; i++) { buf[4 * i] = rgb[3 * i]; buf[4 * i + 1] = rgb[3 * i + 1]; buf[4 * i + 2] = rgb[3 * i + 2]; buf[4 * i + 3] = 255 }
  if (S._ov) { const c = new OffscreenCanvas(S.W, S.H), g = c.getContext('2d'); g.putImageData(new ImageData(buf, S.W, S.H), 0, 0); g.drawImage(S.canvas, 0, 0); return g.getImageData(0, 0, S.W, S.H).data }
  return buf;
}
self.onmessage = (e) => {
  const { name, marks, live } = e.data, t0 = performance.now(), cache = {};
  console.log = () => {}; console.warn = () => {};   // the sheets talk to a terminal; here nobody is listening
  VFS['/out/' + name + '.marks.json'] = marks;
  const K = load(cache, '/lib/oav/index.js', '/'), sheet = K.sheet, paint = K.Tool.prototype._paint;
  let last = t0;
  K.sheet = (cfg) => {
    const S = sheet(cfg);
    S.finish = async () => { const buf = pixels(S); self.postMessage({ type: 'done', name, w: S.W, h: S.H, buf, ms: performance.now() - t0 }, [buf.buffer]); return {} };
    if (live) K.Tool.prototype._paint = function (...a) {
      const r = paint.apply(this, a), now = performance.now();
      if (now - last > 350) { last = now; const buf = pixels(this.S); self.postMessage({ type: 'frame', name, w: this.S.W, h: this.S.H, buf }, [buf.buffer]) }
      return r;
    };
    return S;
  };
  try { load(cache, '/sheets/' + name + '.js', '/') } catch (err) { self.postMessage({ type: 'error', name, message: String(err && err.stack || err) }) }
};
