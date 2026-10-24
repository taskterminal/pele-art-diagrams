# Diagrams, drawn by hand

A one-page site of the four diagram plates (`../fourdiagrams`) and the burger sheet (`../burger/diagrammed`). Nothing
on it is an image file: every plate is drawn in the visitor's browser, in a Worker, by the same JavaScript that drew
it here, from pele's layout of the diagram. pele also lays each diagram's Mermaid text out live in the "how they
were made" section, and the burger film's own code draws its twelve figures in an iframe.

The only pictures are the share card (`og.jpg`) and the icons, since a link preview and a browser tab can't run code.

## Deploy on Vercel

It's a static folder: no build step and no framework. Import the repository, set **Root Directory** to
`diagrams-site`, and leave the build command empty. Or, from this folder:

```bash
npx vercel deploy --prod
```

Once the address is known, make the share links absolute so x.com shows the card, rebuild, and commit:

```bash
SITE=https://your-site.vercel.app node build.mjs
```

## Rebuild

```bash
node build.mjs
```

This regathers everything from `../fourdiagrams` and `../burger/diagrammed`: the drawing code bundled into
`kit/plates.js`, pele's marks in `data/`, the Mermaid text in `src/` and `index.html`, pele in `vendor/`, the
quiet film in `burger/film.html`, the share card and the icons. Run it after a plate is redrawn.

| file | what it is |
|---|---|
| `index.html`, `style.css`, `site.js` | the page, and the script that draws everything on it |
| `plates-worker.js` | the Worker's runtime: stands in for Node's `fs`, `path` and canvas, then runs a plate |
| `burger/sheet-mode.js` | added to the film's build; it draws the twelve figures into one sheet |
| `build.mjs` | puts it all together |
