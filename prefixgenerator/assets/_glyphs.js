// Ekstrak glyph huruf dari PNG rank referensi.
// Teks digambar putih (#ffffff) di baris y=3..7, area x=15..71.
const {png} = require('./_dec.js');

function segment(file, {y0 = 3, y1 = 7, x0 = 15, x1 = 71} = {}) {
  const im = png('minecraft/textures/ranks/' + file);
  const isOn = (x, y) => im.hex(x, y) === '#ffffff';
  const groups = [];
  let cur = null;
  for (let x = x0; x <= Math.min(x1, im.w - 1); x++) {
    let any = false;
    for (let y = y0; y <= y1; y++) if (isOn(x, y)) any = true;
    if (any) { if (!cur) cur = [x, x]; else cur[1] = x; }
    else { if (cur) { groups.push(cur); cur = null; } }
  }
  if (cur) groups.push(cur);
  return groups.map(([a, b]) => {
    const rows = [];
    for (let y = y0; y <= y1; y++) {
      let r = '';
      for (let x = a; x <= b; x++) r += isOn(x, y) ? '#' : '.';
      rows.push(r);
    }
    return { x0: a, x1: b, w: b - a + 1, rows: rows.join('/') };
  });
}

module.exports = { segment };
