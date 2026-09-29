// Génère une icône PNG temporaire (carré uni, couleur de marque) — aucune
// mascotte dédiée au rôle Fournisseur pour l'instant (voir plan). À
// supprimer/remplacer dès qu'un mockup fournit une vraie icône.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function genererPng(taille, cheminSortie) {
  const [r1, g1, b1] = [0x1d, 0x63, 0xe0]; // --brand-blue-end
  const [r2, g2, b2] = [0x4f, 0xa6, 0xfe]; // --brand-blue-start

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(taille, 0);
  ihdr.writeUInt32BE(taille, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(taille * (1 + taille * 3));
  for (let y = 0; y < taille; y++) {
    const rowStart = y * (1 + taille * 3);
    raw[rowStart] = 0; // filtre "none"
    const t = y / (taille - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    for (let x = 0; x < taille; x++) {
      const off = rowStart + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const idat = zlib.deflateSync(raw);

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.mkdirSync(path.dirname(cheminSortie), { recursive: true });
  fs.writeFileSync(cheminSortie, png);
  console.log("écrit :", cheminSortie);
}

const racine = path.join(__dirname, "..");
genererPng(192, path.join(racine, "public/icons/icon-192.png"));
genererPng(512, path.join(racine, "public/icons/icon-512.png"));
genererPng(512, path.join(racine, "src/app/icon.png"));
genererPng(180, path.join(racine, "src/app/apple-icon.png"));
