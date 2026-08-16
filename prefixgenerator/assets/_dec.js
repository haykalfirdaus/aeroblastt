const fs=require('fs'),zlib=require('zlib');
function png(f){const d=fs.readFileSync(f);let p=8,w,h,bd,ct,idat=[],plte,trns;
while(p<d.length){const len=d.readUInt32BE(p);const t=d.toString('ascii',p+4,p+8);
if(t==='IHDR'){w=d.readUInt32BE(p+8);h=d.readUInt32BE(p+12);bd=d[p+16];ct=d[p+17];}
if(t==='PLTE')plte=d.slice(p+8,p+8+len); if(t==='tRNS')trns=d.slice(p+8,p+8+len);
if(t==='IDAT')idat.push(d.slice(p+8,p+8+len)); p+=12+len; if(t==='IEND')break;}
const raw=zlib.inflateSync(Buffer.concat(idat));
const ch=ct===6?4:ct===2?3:ct===4?2:1;
const stride=Math.ceil(w*ch*bd/8); const bpp=Math.max(1,Math.ceil(ch*bd/8));
const out=Buffer.alloc(h*stride);
for(let y=0;y<h;y++){const ft=raw[y*(stride+1)];const line=raw.slice(y*(stride+1)+1,(y+1)*(stride+1));
for(let x=0;x<stride;x++){const a=x>=bpp?out[y*stride+x-bpp]:0;const b=y>0?out[(y-1)*stride+x]:0;const c=(x>=bpp&&y>0)?out[(y-1)*stride+x-bpp]:0;
let v=line[x];if(ft===1)v+=a;else if(ft===2)v+=b;else if(ft===3)v+=(a+b)>>1;else if(ft===4){const pp=a+b-c;const pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}
out[y*stride+x]=v&255;}}
const im={w,h,bd,ct,ch};
im.px=(x,y)=>{if(ct===3){const per=8/bd;const byte=out[y*stride+Math.floor(x/per)];const shift=8-bd*((x%per)+1);const idx=(byte>>shift)&((1<<bd)-1);
 return [plte[idx*3],plte[idx*3+1],plte[idx*3+2],trns&&idx<trns.length?trns[idx]:255];}
 const i=(y*w+x)*ch;return ct===6?[out[i],out[i+1],out[i+2],out[i+3]]:ct===4?[out[i],out[i],out[i],out[i+1]]:[out[i],out[i+1],out[i+2],255];};
im.hex=(x,y)=>{const[R,G,B,A]=im.px(x,y);return A<20?null:'#'+[R,G,B].map(k=>k.toString(16).padStart(2,'0')).join('');};
return im;}
module.exports={png};
