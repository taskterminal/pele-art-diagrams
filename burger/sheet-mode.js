// sheet mode, for the diagrams site: film.html?render&sheet draws the film's twelve figures, each at the frame where
// it has settled, into one 4 x 3 sheet as wide as the page, one figure at a time so they arrive as they're drawn.
// build.mjs passes this file to the film's build with --extra, so it shares the film's own scope (renderInto, SCALE …).
if(QS.has('sheet'))addEventListener('load',()=>{
  const FIGS=[140,236,332,380,476,572,716,860,908,1004,1100,1244],COLS=4,ROWS=Math.ceil(FIGS.length/COLS);
  const k=Math.max(2,Math.min(3,devicePixelRatio||1)),GAP=Math.round(6*k),cell=Math.floor((innerWidth*k-GAP*(COLS-1))/COLS);
  document.documentElement.style.cssText=document.body.style.cssText='margin:0;background:#fff;overflow:hidden;height:auto';
  cv.width=COLS*cell+GAP*(COLS-1);cv.height=ROWS*cell+GAP*(ROWS-1);
  cv.style.cssText='position:static;display:block;width:100%;height:auto;transform:none;cursor:default';
  cv.setAttribute('role','img');cv.setAttribute('aria-label','Twelve diagrams of how a burger is made, drawn live.');
  gx.setTransform(1,0,0,1,0,0);gx.fillStyle='#fff';gx.fillRect(0,0,cv.width,cv.height);
  parent.postMessage({burger:'size',w:cv.width,h:cv.height},'*');
  SCALE=cell/W;LAYERS.clear();
  const t0=performance.now();let i=0;
  const next=()=>{
    if(i>=FIGS.length){parent.postMessage({burger:'done',ms:performance.now()-t0},'*');return}
    renderInto(gx,FIGS[i],(i%COLS)*(cell+GAP),Math.floor(i/COLS)*(cell+GAP),cell/W);gx.setTransform(1,0,0,1,0,0);
    i++;setTimeout(next,0);
  };
  next();
});
