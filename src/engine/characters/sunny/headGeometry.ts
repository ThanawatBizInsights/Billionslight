/**
 * Sunny's head surface: one soft-faceted ellipsoid with
 *  - selective smoothing (smooth normals on the face, subtle facets on the
 *    sides and back),
 *  - gentle cheek / muzzle bulges and shallow eye sockets (displacement),
 *  - a continuous cream facial region (vertex colours) around the eyes and
 *    cheeks, blending softly into the golden-orange fur.
 * Built once per variant and cached. Deterministic.
 */
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SunnyFaceVariant } from "./faceVariants";

/** Head semi-axes (metres, head space) — same overall size as the v1 head. */
export const HEAD_AXES: [number, number, number] = [0.316, 0.232, 0.281];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Unit direction of each eye on the head (x mirrored for the left eye). */
export function eyeDirection(v: SunnyFaceVariant, side: 1 | -1): THREE.Vector3 {
  // direction whose ellipsoid point has x = eyeSpacing, y = eyeY on the front
  const [a, b] = HEAD_AXES;
  const x = (side * v.eyeSpacing) / a;
  const y = v.eyeY / b;
  return new THREE.Vector3(x, y, Math.sqrt(Math.max(0.05, 1 - x * x - y * y))).normalize();
}

interface Bump {
  dir: THREE.Vector3;
  amp: number;
  sigma: number;
}

function displacement(u: THREE.Vector3, bumps: Bump[]): number {
  let d = 0;
  for (const b of bumps) {
    const dist2 = u.distanceToSquared(b.dir);
    d += b.amp * Math.exp(-dist2 / (2 * b.sigma * b.sigma));
  }
  return d;
}

/** 0 = fur, 1 = cream: lower face mask ∪ eye surrounds, with a soft edge. */
function creamWeight(u: THREE.Vector3, v: SunnyFaceVariant): number {
  if (u.z < -0.05) return 0;
  const front = smoothstep(0.05, 0.35, u.z);
  // lower face (cheeks + muzzle + chin)
  const lx = u.x / 0.86;
  const ly = (u.y + 0.5) / 0.55;
  const lower = 1 - smoothstep(0.85, 1.08, Math.hypot(lx, ly));
  // soft patches around each eye that join the lower face
  let eyes = 0;
  for (const side of [1, -1] as const) {
    const e = eyeDirection(v, side);
    const ex = (u.x - e.x) / 0.34;
    const ey = (u.y - e.y - 0.02) / 0.4;
    eyes = Math.max(eyes, 1 - smoothstep(0.8, 1.05, Math.hypot(ex, ey)));
  }
  // keep a strip of fur between the eyes / forehead centre (squirrel stripe)
  const stripe = smoothstep(0.08, 0.0, Math.abs(u.x)) * smoothstep(-0.05, 0.12, u.y);
  return Math.min(1, Math.max(lower, eyes * (1 - stripe))) * front;
}

function bumpsFor(v: SunnyFaceVariant): Bump[] {
  return [
    { dir: new THREE.Vector3(0.6, -0.42, 0.68).normalize(), amp: v.cheekBulge, sigma: 0.3 },
    { dir: new THREE.Vector3(-0.6, -0.42, 0.68).normalize(), amp: v.cheekBulge, sigma: 0.3 },
    { dir: new THREE.Vector3(0, -0.42, 0.9).normalize(), amp: v.muzzleBulge, sigma: 0.2 },
    { dir: eyeDirection(v, 1), amp: -v.socketDepth, sigma: 0.14 },
    { dir: eyeDirection(v, -1), amp: -v.socketDepth, sigma: 0.14 },
  ];
}

const cache = new Map<string, THREE.BufferGeometry>();

export function buildHeadGeometry(v: SunnyFaceVariant, furHex: string, creamHex: string): THREE.BufferGeometry {
  const key = `${v.id}|${v.headDetail}|${v.faceSmoothing}|${v.cheekBulge}|${v.muzzleBulge}|${v.socketDepth}|${furHex}|${creamHex}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const [a, b, c] = HEAD_AXES;
  const base = new THREE.IcosahedronGeometry(1, v.headDetail);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const g = mergeVertices(base, 1e-5);
  const pos = g.attributes.position as THREE.BufferAttribute;

  const bumps = bumpsFor(v);

  const fur = new THREE.Color(furHex);
  const cream = new THREE.Color(creamHex);
  const colors = new Float32Array(pos.count * 3);
  const u = new THREE.Vector3();
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    u.fromBufferAttribute(pos, i).normalize();
    const d = displacement(u, bumps);
    pos.setXYZ(i, u.x * a + u.x * d, u.y * b + u.y * d, u.z * c + u.z * d);
    tmp.copy(fur).lerp(cream, creamWeight(u, v));
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals(); // smooth normals

  // Non-indexed copy: blend smooth normals with per-face (faceted) normals.
  const flat = g.toNonIndexed();
  const fp = flat.attributes.position as THREE.BufferAttribute;
  const fn = flat.attributes.normal as THREE.BufferAttribute;
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const C = new THREE.Vector3();
  const faceN = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let t = 0; t < fp.count; t += 3) {
    A.fromBufferAttribute(fp, t);
    B.fromBufferAttribute(fp, t + 1);
    C.fromBufferAttribute(fp, t + 2);
    faceN.subVectors(C, B).cross(A.clone().sub(B)).normalize();
    const centroid = A.clone().add(B).add(C).normalize();
    // smooth on the face, faceted on the sides/back
    const w = v.faceSmoothing * smoothstep(0.15, 0.6, centroid.z);
    for (let k = 0; k < 3; k++) {
      n.fromBufferAttribute(fn, t + k).lerp(faceN, 1 - w).normalize();
      fn.setXYZ(t + k, n.x, n.y, n.z);
    }
  }
  fn.needsUpdate = true;
  flat.computeBoundingSphere();
  cache.set(key, flat);
  return flat;
}

/** Point on the (displaced) head surface along a unit direction, plus its normal. */
export function headSurface(v: SunnyFaceVariant, dir: THREE.Vector3): { point: THREE.Vector3; normal: THREE.Vector3 } {
  const [a, b, c] = HEAD_AXES;
  const u = dir.clone().normalize();
  const d = displacement(u, bumpsFor(v));
  const point = new THREE.Vector3(u.x * (a + d), u.y * (b + d), u.z * (c + d));
  const normal = new THREE.Vector3(point.x / (a * a), point.y / (b * b), point.z / (c * c)).normalize();
  return { point, normal };
}
