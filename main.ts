import{mkdirSync,readdirSync,readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output',E=new TextEncoder(),S='01146abfgggggggg999999959995999g999ggggggggggggg04400ggggggggggg58gggggggggggggg4414',A=[];
for(let i=0;i<256;i++)A[i]=parseInt(S[i],16);
const F={16:(a,b)=>a+b,17:(a,b)=>a-b,18:Math.imul,19:(a,b)=>a/b,20:(a,b)=>a%b,21:(a,b)=>Math.floor((a>>>0)/(b>>>0)),22:(a,b)=>(a>>>0)%(b>>>0),24:(a,b)=>a&b,25:(a,b)=>a|b,26:(a,b)=>a^b,28:(a,b)=>a<<b,29:(a,b)=>a>>b,30:(a,b)=>a>>>b,32:(a,b)=>a==b?1:0,33:(a,b)=>a<b?1:0,34:(a,b)=>(a>>>0)<(b>>>0)?1:0};
function run(p,w){
const n=p.length,m=new Int32Array(576),u=new Uint8Array(65536);
let sp=0,cs=0,pc=0,st=0,ol=0,ip=0;
const d=e=>[u.subarray(0,ol),e];
for(;;){
if(st==1e6)return d(10);
if(pc<0||pc>=n)return d(9);
const op=p[pc],v=A[op];
if(v!==v)return d(5);
const im=op==1?1:op==2?4:op>47&&op<52?2:0;
if(pc+im>=n)return d(9);
st++;
const nx=pc+1+im,po=v>>2,pu=v&3;
if(sp<po)return d(2);
if(sp-po+pu>256)return d(3);
pc=nx;
if(op>15&&op<35&&op!=23&&op!=27){
const b=m[sp-1],a=m[sp-2];
if(!b&&op>18&&op<23)return d(4);
sp-=2;m[sp++]=F[op](a,b);continue;
}
switch(op){
case 0:return d(0);
case 1:m[sp++]=p.readInt8(nx-1);break;
case 2:m[sp++]=p.readInt32LE(nx-4);break;
case 3:sp--;break;
case 4:m[sp]=m[sp-1];sp++;break;
case 5:var t=m[sp-1];m[sp-1]=m[sp-2];m[sp-2]=t;break;
case 6:m[sp]=m[sp-2];sp++;break;
case 7:t=m[sp-3];m[sp-3]=m[sp-2];m[sp-2]=m[sp-1];m[sp-1]=t;break;
case 23:m[sp-1]=-m[sp-1];break;
case 27:m[sp-1]=~m[sp-1];break;
case 48:case 49:case 50:{
const r=p.readInt16LE(nx-2);
let q=1;
if(op!=48){const v=m[--sp];q=op==49?v==0:v!=0;}
if(q)pc=nx+r;
break;
}
case 51:if(cs==64)return d(7);m[512+cs++]=nx;pc=p.readUInt16LE(nx-2);break;
case 52:if(cs==0)return d(8);pc=m[512+--cs];break;
case 64:{const a=m[sp-1];if(a<0||a>255)return d(6);m[sp-1]=m[256+a];break;}
case 65:{const a=m[sp-1],v=m[sp-2];if(a<0||a>255)return d(6);sp-=2;m[256+a]=v;break;}
case 80:{const b=E.encode(m[sp-1]+'');if(ol+b.length>65536)return d(11);sp--;u.set(b,ol);ol+=b.length;break;}
case 81:if(ol+1>65536)return d(11);u[ol++]=m[--sp]&255;break;
case 82:m[sp++]=ip<w.length?w[ip++]:-1;break;
case 83:return d(m[--sp]&255);
}
}
}
for(const id of readdirSync(I).sort()){
const[x,e]=run(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
mkdirSync(join(O,id),{recursive:true});
writeFileSync(join(O,id,'stdout.bin'),x);
writeFileSync(join(O,id,'exit.txt'),e+'\n');
}
