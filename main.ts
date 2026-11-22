// Tiny stack VM: one ArrayBuffer + DataView. Stack words 0..255, memory
// words 256..511, call stack words 512..575. All access via DataView
// get/setInt32 little-endian; PUSH8 sign-extends via getInt8.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const enc = new TextEncoder();
// [opcode, pops, pushes, immBytes]
const T = [
  [0, 0, 0, 0], [1, 0, 1, 1], [2, 0, 1, 4], [3, 1, 0, 0], [4, 1, 2, 0],
  [5, 2, 2, 0], [6, 2, 3, 0], [7, 3, 3, 0], [16, 2, 1, 0], [17, 2, 1, 0],
  [18, 2, 1, 0], [19, 2, 1, 0], [20, 2, 1, 0], [21, 2, 1, 0], [22, 2, 1, 0],
  [23, 1, 1, 0], [24, 2, 1, 0], [25, 2, 1, 0], [26, 2, 1, 0], [27, 1, 1, 0],
  [28, 2, 1, 0], [29, 2, 1, 0], [30, 2, 1, 0], [32, 2, 1, 0], [33, 2, 1, 0],
  [34, 2, 1, 0], [48, 0, 0, 2], [49, 1, 0, 2], [50, 1, 0, 2], [51, 0, 0, 2],
  [52, 0, 0, 0], [64, 1, 1, 0], [65, 2, 0, 0], [80, 1, 0, 0], [81, 1, 0, 0],
  [82, 0, 1, 0], [83, 1, 0, 0],
];
const OK = new Uint8Array(256), PP = new Uint8Array(256);
const QQ = new Uint8Array(256), IM = new Uint8Array(256);
for (const [o, p, q, i] of T) { OK[o] = 1; PP[o] = p; QQ[o] = q; IM[o] = i; }
function run(p, inp) {
  const n = p.length, pv = new DataView(p.buffer, p.byteOffset, p.byteLength);
  const dv = new DataView(new ArrayBuffer(2304));
  const g = (o) => dv.getInt32(o * 4, true);
  const s = (o, v) => dv.setInt32(o * 4, v, true);
  const out = new Uint8Array(65536);
  let sp = 0, cs = 0, pc = 0, st = 0, ol = 0, ip = 0;
  const d = (e) => [out.subarray(0, ol), e];
  for (;;) {
    if (st === 1000000) return d(10);
    if (pc < 0 || pc >= n) return d(9);
    const op = p[pc];
    if (!OK[op]) return d(5);
    const im = IM[op];
    if (pc + im >= n) return d(9);
    st++;
    const nx = pc + 1 + im, po = PP[op], pu = QQ[op];
    if (sp < po) return d(2);
    if (sp - po + pu > 256) return d(3);
    pc = nx;
    switch (op) {
      case 0: return d(0);
      case 1: s(sp++, pv.getInt8(nx - 1)); break;
      case 2: s(sp++, pv.getInt32(nx - 4, true)); break;
      case 3: sp--; break;
      case 4: s(sp, g(sp - 1)); sp++; break;
      case 5: { const t = g(sp - 1); s(sp - 1, g(sp - 2)); s(sp - 2, t); break; }
      case 6: s(sp, g(sp - 2)); sp++; break;
      case 7: {
        const a = g(sp - 3);
        s(sp - 3, g(sp - 2)); s(sp - 2, g(sp - 1)); s(sp - 1, a);
        break;
      }
      case 23: s(sp - 1, -g(sp - 1) | 0); break;
      case 27: s(sp - 1, ~g(sp - 1)); break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30:
      case 32: case 33: case 34: {
        const b = g(sp - 1), a = g(sp - 2);
        let r;
        switch (op) {
          case 16: r = a + b | 0; break;
          case 17: r = a - b | 0; break;
          case 18: r = Math.imul(a, b); break;
          case 19:
            if (b === 0) return d(4);
            r = a === -2147483648 && b === -1 ? a : a / b | 0;
            break;
          case 20:
            if (b === 0) return d(4);
            r = b === -1 ? 0 : a % b | 0;
            break;
          case 21:
            if (b === 0) return d(4);
            r = Math.floor((a >>> 0) / (b >>> 0)) | 0;
            break;
          case 22:
            if (b === 0) return d(4);
            r = (a >>> 0) % (b >>> 0) | 0;
            break;
          case 24: r = a & b; break;
          case 25: r = a | b; break;
          case 26: r = a ^ b; break;
          case 28: r = a << (b & 31); break;
          case 29: r = a >> (b & 31); break;
          case 30: r = a >>> (b & 31) | 0; break;
          case 32: r = a === b ? 1 : 0; break;
          case 33: r = a < b ? 1 : 0; break;
          default: r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        }
        sp -= 2; s(sp, r); sp++;
        break;
      }
      case 48: case 49: case 50: {
        const rel = pv.getInt16(nx - 2, true);
        let t = true;
        if (op !== 48) { const v = g(--sp); t = op === 49 ? v === 0 : v !== 0; }
        if (t) pc = nx + rel;
        break;
      }
      case 51:
        if (cs === 64) return d(7);
        s(512 + cs++, nx);
        pc = pv.getUint16(nx - 2, true);
        break;
      case 52:
        if (cs === 0) return d(8);
        pc = g(512 + --cs);
        break;
      case 64: {
        const ad = g(sp - 1);
        if (ad < 0 || ad >= 256) return d(6);
        s(sp - 1, g(256 + ad));
        break;
      }
      case 65: {
        const ad = g(sp - 1), v = g(sp - 2);
        if (ad < 0 || ad >= 256) return d(6);
        sp -= 2; s(256 + ad, v);
        break;
      }
      case 80: {
        const by = enc.encode(String(g(sp - 1)));
        if (ol + by.length > 65536) return d(11);
        sp--; out.set(by, ol); ol += by.length;
        break;
      }
      case 81:
        if (ol + 1 > 65536) return d(11);
        out[ol++] = g(--sp) & 255;
        break;
      case 82: s(sp++, ip < inp.length ? inp[ip++] : -1); break;
      case 83: return d(g(--sp) & 255);
    }
  }
}
for (const id of readdirSync(I).sort()) {
  const [o, e] = run(
    readFileSync(join(I, id, 'program.bin')),
    readFileSync(join(I, id, 'input.bin')),
  );
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), o);
  writeFileSync(join(O, id, 'exit.txt'), e + '\n');
}
