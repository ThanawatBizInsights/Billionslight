/**
 * Procedural iris texture for Sunny's eyeball.
 *
 * Painted in the eyeball's own spherical UV space by projecting each texel's
 * direction onto the eye's front plane, so iris and pupil wrap the curved
 * surface exactly (no floating discs, no z-fighting). Contents:
 * warm-white sclera, purple iris with a darker top and a brighter lower
 * crescent, a soft limbal ring, and a large deep-plum pupil.
 * Catchlights are NOT baked in — they are separate surface patches that stay
 * fixed to the light while the eye looks around.
 */
import * as THREE from "three";
import { SUNNY_EYE_COLORS } from "./faceVariants";

const cache = new Map<string, THREE.DataTexture>();

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function irisTexture(irisWidth: number, pupilWidth: number, heightRatio: number): THREE.DataTexture {
  const key = `${irisWidth}|${pupilWidth}|${heightRatio}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 512;
  const H = 256;
  const data = new Uint8Array(W * H * 4);
  const col = (hex: string) => new THREE.Color(hex);
  const sclera = col(SUNNY_EYE_COLORS.sclera);
  const irisBase = col(SUNNY_EYE_COLORS.irisBase);
  const irisDark = col(SUNNY_EYE_COLORS.irisDark);
  const irisHi = col(SUNNY_EYE_COLORS.irisHighlight);
  const limbal = col(SUNNY_EYE_COLORS.limbal);
  const pupil = col(SUNNY_EYE_COLORS.pupil);
  const c = new THREE.Color();
  // iris: slightly taller than wide (reference ~1.3 aspect); eye is already
  // stretched by heightRatio, so compensate a little.
  const irX = irisWidth;
  const irY = irisWidth * (1.3 / heightRatio);
  const puX = pupilWidth;
  const puY = pupilWidth * (1.28 / heightRatio);
  for (let j = 0; j < H; j++) {
    const theta = (1 - (j + 0.5) / H) * Math.PI; // uv.y → polar angle
    for (let i = 0; i < W; i++) {
      const phi = ((i + 0.5) / W) * Math.PI * 2;
      // THREE.SphereGeometry parametrisation
      const x = -Math.cos(phi) * Math.sin(theta);
      const y = Math.cos(theta);
      const z = Math.sin(phi) * Math.sin(theta);
      c.copy(sclera);
      if (z > 0) {
        const ix = x / irX;
        const iy = (y + 0.02) / irY;
        const ri = Math.hypot(ix, iy);
        if (ri < 1.02) {
          // iris gradient: darker top, base middle, brighter lower crescent
          c.copy(irisDark).lerp(irisBase, smooth(0.55, -0.15, iy));
          const crescent = smooth(0.2, 0.8, -iy) * smooth(0.55, 0.9, ri);
          c.lerp(irisHi, crescent * 0.6);
          // subtle radial fibres for life (deterministic)
          const ang = Math.atan2(iy, ix);
          c.multiplyScalar(0.96 + 0.04 * Math.sin(ang * 23));
          // limbal ring
          c.lerp(limbal, smooth(0.86, 1.0, ri) * 0.75);
          // pupil (slightly above centre, as in the reference)
          const px = x / puX;
          const py = (y - 0.04) / puY;
          const rp = Math.hypot(px, py);
          c.lerp(pupil, 1 - smooth(0.93, 1.0, rp));
          // lilac reflection crescent across the lower iris/pupil (reference SVG)
          const outer = Math.hypot(ix / 0.7, (iy + 0.4) / 0.4);
          const inner = Math.hypot(ix / 0.74, (iy + 0.2) / 0.36);
          const cres = (1 - smooth(0.85, 1.0, outer)) * smooth(0.92, 1.06, inner);
          c.lerp(irisHi, cres);
          // anti-aliased iris edge against the sclera
          c.lerp(sclera, smooth(0.99, 1.02, ri));
        }
      }
      const k = (j * W + i) * 4;
      data[k] = Math.round(c.r * 255);
      data[k + 1] = Math.round(c.g * 255);
      data[k + 2] = Math.round(c.b * 255);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.colorSpace = THREE.LinearSRGBColorSpace; // values above are linear (THREE.Color stores linear)
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}
