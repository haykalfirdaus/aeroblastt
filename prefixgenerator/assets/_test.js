// Verifikasi: render lewat kode generator, bandingkan pixel-per-pixel
// dengan PNG rank asli.
const fs = require('fs');
const {png} = require('./_dec.js');

const js = fs.readFileSync('rank-generator.html', 'utf8')
  .split('<script>')[1].split('</' + 'script>')[0];

const store = {}, checks = {};
function mkCanvas(){
  const g = [];
  return {width:0, height:0, grid:g, style:{},
    getContext(){ return {
      fillStyle:'#000',
      fillRect(x,y,w,h){ for(let j=0;j<h;j++){ g[y+j]=g[y+j]||[]; for(let i=0;i<w;i++) g[y+j][x+i]=this.fillStyle; } },
      clearRect(x,y,w,h){ for(let j=0;j<h;j++){ g[y+j]=g[y+j]||[]; for(let i=0;i<w;i++) g[y+j][x+i]=null; } },
      drawImage(){}, imageSmoothingEnabled:true }; },
    toDataURL(){ return 'data:,'; }, appendChild(){}, append(){} };
}
const els = {};
const el = id => els[id] || (els[id] = {
  get value(){ return store[id]; }, set value(v){ store[id]=v; },
  get checked(){ return !!checks[id]; }, set checked(v){ checks[id]=v; },
  disabled:false, addEventListener(){}, style:{}, innerHTML:'', textContent:'',
  appendChild(){}, append(){}, getContext(){ return mkCanvas().getContext(); },
  width:0, height:0 });

global.document = {
  getElementById: el,
  createElement: t => t === 'canvas' ? mkCanvas() : el('_tmp' + Math.random()),
  querySelector: () => ({innerHTML:''}) };
global.Image = function(){ return {style:{}}; };
global.Blob = function(){};
global.TextEncoder = function(){ this.encode = s => Buffer.from(s); };
global.alert = () => {}; global.confirm = () => true;
global.navigator = {clipboard:{writeText:()=>Promise.resolve()}};
global.URL = {createObjectURL:()=>''};

Object.assign(store, {txt:'MEMBER', offx:'0', tracking:'1', cBase:'#d0d0d0',
  cMid:'#9d9d9d', cDark:'#6c6c6c', cText:'#ffffff', cShadow:'#000000',
  cIcon:'#ffaa00', fheight:'11', fascent:'9', fname:'member', folder:'ranks', glyph:''});

eval(js);

// rank -> {teks, palet plate} diambil dari PNG asli
const CASES = [
  ['member','MEMBER','#d0d0d0','#9d9d9d','#6c6c6c'],
  ['scout','SCOUT','#fffa00','#c8c400','#787500'],
  ['voyager','VOYAGER','#00e1ff','#3bb8c8','#009baf'],
  ['orbiter','ORBITER','#1fff00','#18c500','#139c00'],
  ['ravest','RAVEST','#ff2929','#d20000','#930000'],
  ['vortex','VORTEX','#a03dff','#6a3999','#351356'],
  ['quantum','QUANTUM','#33ccff','#3b8aa3','#16596f'],
  ['universe','UNIVERSE','#e68eff','#c700ff','#9100ba'],
  ['helper','HELPER','#f30000','#aa0000','#6f0000'],
  ['builder','BUILDER','#f30000','#aa0000','#6f0000'],
  ['matematika','MATEMATIKA','#f30000','#aa0000','#6f0000'],
];

function diffAt(name, text, base, mid, dark, off){
  Object.assign(store, {txt:text, cBase:base, cMid:mid, cDark:dark, offx:String(off)});
  checks.autoTone = false; checks.icOwnColor = false;
  const c = cfg(); c.icon = name;
  const grid = render(c).canvas.grid;
  const im = png('minecraft/textures/ranks/' + name + '.png');
  let d = 0, sample = [];
  for (let y = 0; y < 12; y++) for (let x = 0; x < 74; x++){
    const a = (grid[y] && grid[y][x]) ? grid[y][x].toLowerCase() : null;
    const b = im.hex(x, y);
    if (a !== b){ d++; if (sample.length < 5) sample.push(`${x},${y} got=${a} want=${b}`); }
  }
  return {d, sample};
}

let total = 0;
for (const [name, text, base, mid, dark] of CASES){
  let best = null, bestOff = 0;
  for (let off = -4; off <= 4; off++){
    const r = diffAt(name, text, base, mid, dark, off);
    if (!best || r.d < best.d){ best = r; bestOff = off; }
  }
  total += best.d;
  const tag = best.d === 0 ? 'IDENTIK' : `diff ${best.d}`;
  console.log(name.padEnd(12), `offx=${String(bestOff).padStart(2)}  ${tag}`,
    best.d ? '  ' + best.sample.join(' | ') : '');
}
console.log('\nTOTAL DIFF (offset terbaik):', total);
