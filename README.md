# Diagrams, drawn by hand

A one-page site of four diagram plates and the burger sheet. Nothing on it is an image file: every plate is drawn
in the visitor's browser, in a Worker, by the same JavaScript that drew it in Node, from pele's layout of the
diagram. pele also lays each diagram's Mermaid text out live in the "how they were made" section, and the burger
film's own code draws its twelve figures in an iframe.

The only pictures are the share card (`og.jpg`) and the icons, since a link preview and a browser tab can't run code.

## Deploy on Vercel

It's a static site: no build step and no framework. Import this repository in Vercel, choose the "Other" preset,
and leave the build command empty.

Once the address is known, make the share links absolute so x.com shows the card (see below).

## Where it comes from

The site is built in the dew film series' working copy, where it sits beside the projects it draws from:
`../fourdiagrams`, which holds the plates' drawing code, and `../burger/diagrammed`, which holds the burger film.
From there:

```bash
node build.mjs
SITE=https://your-site.vercel.app node build.mjs   # with absolute share links
```

This regathers everything:
- the drawing code, bundled into `kit/plates.js`;
- pele's marks, in `data/`;
- the Mermaid text, in `src/` and `index.html`;
- pele itself, in `vendor/`;
- the quiet film, in `burger/film.html`;
- the share card and the icons.

This repository holds the built result.

| file | what it is |
|---|---|
| `index.html`, `style.css`, `site.js` | the page, and the script that draws everything on it |
| `kit/plates.js` | the plates' drawing code (generated), run by the Worker |
| `plates-worker.js` | the Worker's runtime: stands in for Node's `fs`, `path` and canvas, then runs a plate |
| `burger/film.html`, `burger/sheet-mode.js` | the burger film without sound, and the mode that draws its twelve figures as one sheet |
| `data/`, `src/`, `vendor/` | pele's marks, the Mermaid text, and pele (MIT) |
| `build.mjs` | puts it all together (needs the dew working copy) |

pele is MIT. The letters are A. V. Hershey's 1967 fonts (public domain), by way of hersheytext (MIT).
