// VOID HARVEST submission packaging. This entrypoint prepares local artifacts only;
// it does not upload, publish, register, or submit the competition entry.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, readGameTree } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Catch incomplete authoring/captures before writing output. The official tree reader
// enforces the competition's byte, entry, path and regular-file limits.
readGameTree(join(here, 'game'), caps);
for (const file of ['index.html', 'style.css', 'src/main.js', 'src/world.js', 'src/render.js', 'src/audio.js']) {
  if (!existsSync(join(here, 'game', file))) throw new Error(`Missing game runtime file: ${file}`);
}
const shots = readdirSync(join(here, 'screenshots')).filter(name => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) throw new Error('Capture 3 or 4 genuine browser screenshots before packaging.');
function imageDimensions(bytes: Buffer): [number, number] {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 255) throw new Error('Malformed JPEG marker');
      const marker = bytes[offset + 1];
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) return [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
      const size = bytes.readUInt16BE(offset + 2);
      if (size < 2) break;
      offset += size + 2;
    }
  }
  throw new Error('Expected a complete PNG or JPEG screenshot.');
}
for (const shot of shots) {
  const bytes = readFileSync(join(here, 'screenshots', shot));
  const [width, height] = imageDimensions(bytes);
  if (Math.max(width,height) > 1280 || Math.min(width,height) < 480) throw new Error(`${shot}: capture a viewport with long side <=1280 and short side >=480; got ${width}x${height}.`);
  if (bytes.length > caps.screenshots.max_bytes) throw new Error(`${shot}: over the 256 KiB screenshot limit.`);
}
if (out === resolve(here) || out.startsWith(resolve(here, 'game'))) throw new Error('Output must be separate from the repository root and game runtime.');
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
const dossier = buildDossier(out, caps);
if (dossier.length > 1572864) throw new Error('Dossier exceeds the competition’s 1.5 MiB limit.');
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`VOID HARVEST packaged locally: ${shots.length} screenshots, ${dossier.length} dossier bytes. No submission made.`);
