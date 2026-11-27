#!/usr/bin/env node
/**
 * Shot planner: projects world points through a camera and prints normalised
 * screen coordinates (0–1, origin top-left). Values outside 0–1 are off-screen.
 * Use it to frame camera keyframes numerically before rendering.
 *
 *   node scripts/plan-shot.mjs '{"pos":[10,2,15],"target":[1,4,3],"fov":44,"aspect":0.5625,
 *                                "points":{"head":[0,1.9,7],"array":[-0.3,6.7,1.8]}}'
 */
import * as THREE from "three";
const shots = [].concat(JSON.parse(process.argv[2] ?? "[]"));
for (const s of shots) {
  const cam = new THREE.PerspectiveCamera(s.fov ?? 40, s.aspect ?? 9 / 16, 0.1, 400);
  cam.position.set(...s.pos);
  cam.lookAt(...s.target);
  cam.updateMatrixWorld();
  const out = {};
  for (const [k, p] of Object.entries(s.points ?? {})) {
    const v = new THREE.Vector3(...p).project(cam);
    out[k] = [+((v.x + 1) / 2).toFixed(2), +((1 - v.y) / 2).toFixed(2)];
  }
  console.log(JSON.stringify({ pos: s.pos, target: s.target, fov: s.fov }), JSON.stringify(out));
}
