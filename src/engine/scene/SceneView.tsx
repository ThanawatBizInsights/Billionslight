/**
 * Generic 3D scene renderer. Reads one validated Scene + cast and renders
 * environment, lighting, camera, characters (pose, expression, props,
 * look-at) and energy flows for the current frame. No episode-specific logic.
 */
import { ThreeCanvas } from "@remotion/three";
import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { Episode, Scene, Vec3 } from "../../schemas/episode";
import { blinkAmount, clamp, lerp, lerpAngle, lerpVec3, progress, sampleTrack, type Keyframe } from "../animation/core";
import { evaluatePose, type ClipBody, type Motion } from "../animation/clips";
import { getCharacter } from "../characters/library";
import { CharacterModel, eyeHeightWorld, modelScale } from "../characters/CharacterModel";
import { getExpression } from "../characters/expressions";
import { blendFaces, type FaceState } from "../characters/rig";
import type { Attachments } from "../characters/parts";
import type { CharacterDefinition } from "../characters/types";
import { CameraRig, sampleCamera, type CameraShot } from "../cameras/CameraRig";
import { getCameraPreset } from "../cameras/presets";
import { getShot, SHOTS } from "../cameras/shots";
import { environmentCables, getEnvironment, type EnvironmentDefinition } from "../environments/registry";
import { LightingRig } from "../lighting/LightingRig";
import { blendPresets, getLightingPreset, type LightingPreset } from "../lighting/presets";
import { EnergyPath } from "../energy-flow/EnergyPath";
import { sampleElectrical } from "../energy-flow/timeline";
import type { FlowId } from "../energy-flow/scenario";
import type { EnergyColorKey } from "../../config/palette";
import { Atmosphere } from "../core/Atmosphere";
import type { QualityPreset } from "../../config/formats";
import { PROPS, PROP_GRIPS } from "../props/Props";

type Track = Scene["characters"][number];

interface CharState {
  castId: string;
  def: CharacterDefinition;
  variant?: string;
  position: Vec3;
  rotationY: number;
}

export function cameraKeysForScene(scene: Scene, focus: Vec3): Keyframe<CameraShot>[] {
  if (scene.camera.keyframes.length > 0) {
    return scene.camera.keyframes.map((k) => ({ frame: k.frame, value: { position: k.position, target: k.target, fov: k.fov ?? 40 }, easing: k.easing }));
  }
  return getCameraPreset(scene.camera.preset ?? "establishing-wide")({ focus, durationInFrames: scene.durationInFrames });
}

/** Character placement (position + yaw) at a frame. */
export function samplePlacement(t: Track, frame: number): { position: Vec3; rotationY: number } {
  const s = sampleTrack(
    t.keyframes.map((k, i) => ({
      frame: k.frame,
      easing: k.easing,
      value: {
        p: k.position ?? t.keyframes.slice(0, i).reverse().find((x) => x.position)?.position ?? [0, 0, 0],
        r: k.rotationY ?? t.keyframes.slice(0, i).reverse().find((x) => x.rotationY !== undefined)?.rotationY ?? 0,
      },
    })),
    frame,
    (a, b, w) => ({ p: lerpVec3(a.p as Vec3, b.p as Vec3, w), r: lerpAngle(a.r, b.r, w) }),
  );
  return { position: s.p as Vec3, rotationY: s.r };
}

/**
 * Root motion along the position track: distance travelled since frame 0
 * (drives the gait phase) and current ground speed (drives gait amplitude).
 */
export function sampleMotion(t: Track, frame: number, fps: number): Motion & { heading: number | null } {
  const pos = (f: number) => samplePlacement(t, f).position;
  let travel = 0;
  let prev = pos(0);
  for (let f = 1; f <= frame; f++) {
    const p = pos(f);
    travel += Math.hypot(p[0] - prev[0], p[2] - prev[2]);
    prev = p;
  }
  const a = pos(Math.max(0, frame - 2));
  const b = pos(frame + 2);
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const dist = Math.hypot(dx, dz);
  const span = frame + 2 - Math.max(0, frame - 2);
  return { travel, speed: (dist / span) * fps, heading: dist > 1e-4 ? Math.atan2(dx, dz) : null };
}

/** Base face from the expression track, blended over 8 frames at each change. */
export function sampleExpression(t: Track, def: CharacterDefinition, frame: number): FaceState {
  const keys = [...t.expression].sort((a, b) => a.frame - b.frame);
  let prev = getExpression(def.defaultExpression);
  let cur = prev;
  let start = -Infinity;
  let easing: Parameters<typeof progress>[3] = "easeInOut";
  for (const k of keys) {
    if (k.frame > frame) break;
    prev = cur;
    cur = getExpression(k.expression);
    start = k.frame;
    easing = k.easing;
  }
  if (start === -Infinity) return cur;
  return blendFaces(prev, cur, progress(frame, start, start + 8, easing));
}

/** Lighting at a frame: base preset blended through the scene's transitions. */
export function sampleLighting(scene: Scene, frame: number): LightingPreset {
  let cur = getLightingPreset(scene.lighting.preset);
  for (const t of [...scene.lighting.transitions].sort((a, b) => a.frame - b.frame)) {
    if (frame < t.frame) break;
    cur = blendPresets(cur, getLightingPreset(t.preset), progress(frame, t.frame, t.frame + t.transitionFrames, "easeInOut"));
  }
  return cur;
}

/** Environment state: defaults, then each state keyframe cross-faded in order. */
export function sampleEnvironmentState(scene: Scene, defaults: Record<string, number>, frame: number): Record<string, number> {
  const state = { ...defaults };
  for (const k of [...scene.environment.states].sort((a, b) => a.frame - b.frame)) {
    if (frame < k.frame) break;
    const w = progress(frame, k.frame, k.frame + k.transitionFrames, "easeInOut");
    for (const [key, v] of Object.entries(k.values)) state[key] = lerp(state[key] ?? 0, v, w);
  }
  return state;
}

type Subject = Vec3 | string | { castId: string } | undefined;

/** Eye-level world point of a cast member at any frame (lowered when seated). */
function eyeWorldAt(t: Track, def: CharacterDefinition, frame: number): Vec3 {
  const p = samplePlacement(t, frame).position;
  const s = modelScale(def);
  let y = p[1] + eyeHeightWorld(def);
  for (const c of t.clips) {
    if (c.clip !== "sit" || frame < c.from || frame > c.from + c.durationInFrames) continue;
    const seat = typeof c.params.seatHeight === "number" ? c.params.seatHeight : 0.45;
    y -= (def.body.hipHeight * s - seat) * Math.min(1, (frame - c.from) / Math.max(1, c.blendFrames));
  }
  return [p[0], y, p[2]];
}

/**
 * Camera at a frame: explicit keyframes win; otherwise the shot list (hard
 * cuts at each shot's `from`); otherwise the scene preset.
 */
export function sampleSceneCamera(scene: Scene, episode: Episode, env: EnvironmentDefinition, frame: number, aspect: number): CameraShot {
  if (scene.camera.keyframes.length > 0) return sampleCamera(cameraKeysForScene(scene, env.focus), frame);
  const shots = [...scene.camera.shots].sort((a, b) => a.from - b.from);
  const active = shots.filter((sh) => sh.from <= frame).pop();
  const spec = active ?? (scene.camera.preset && SHOTS[scene.camera.preset] ? { from: 0, preset: scene.camera.preset, subject: scene.camera.subject, subject2: scene.camera.subject2, params: scene.camera.params } : null);
  if (!spec) return sampleCamera(cameraKeysForScene(scene, env.focus), frame);
  const next = shots.find((sh) => sh.from > spec.from);
  const end = next ? next.from : scene.durationInFrames;
  const resolver = (subj: Subject): ((f: number) => Vec3) => {
    if (subj === undefined) return () => env.focus;
    if (Array.isArray(subj)) return () => subj as Vec3;
    if (typeof subj === "string") {
      const a = env.anchors[subj];
      if (!a) throw new Error(`Unknown camera subject anchor "${subj}" in "${env.id}"`);
      return () => a;
    }
    const track = scene.characters.find((c) => c.castId === subj.castId);
    const cast = episode.cast.find((c) => c.id === subj.castId);
    if (!track || !cast) throw new Error(`Camera subject "${subj.castId}" is not in this scene`);
    const def = getCharacter(cast.characterId);
    return (f) => eyeWorldAt(track, def, f);
  };
  const subjTrack = typeof spec.subject === "object" && !Array.isArray(spec.subject) ? scene.characters.find((c) => c.castId === (spec.subject as { castId: string }).castId) : undefined;
  return getShot(spec.preset)({
    frame: frame - spec.from,
    durationInFrames: end - spec.from,
    aspect,
    subject: (f) => resolver(spec.subject)(f + spec.from),
    subject2: spec.subject2 !== undefined ? (f) => resolver(spec.subject2)(f + spec.from) : undefined,
    subjectYaw: subjTrack ? (f) => samplePlacement(subjTrack, f + spec.from).rotationY : undefined,
    params: spec.params,
  });
}

function resolveTarget(target: Vec3 | string | { castId: string }, env: EnvironmentDefinition, states: CharState[]): Vec3 | null {
  if (typeof target === "string") return env.anchors[target] ?? null;
  if (Array.isArray(target)) return target as Vec3;
  const o = states.find((s) => s.castId === target.castId);
  return o ? [o.position[0], o.position[1] + eyeHeightWorld(o.def), o.position[2]] : null;
}

export function SceneView({ scene, episode, quality }: { scene: Scene; episode: Episode; quality: QualityPreset }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const env = getEnvironment(scene.environment.id);
  const sampled = sampleLighting(scene, frame);
  const lighting = env.adjustLighting ? env.adjustLighting(sampled) : sampled;
  const shot = sampleSceneCamera(scene, episode, env, frame, width / height);
  const energy = sampleElectrical(scene.electrical, frame);
  const envState = sampleEnvironmentState(scene, env.defaultState?.(lighting, energy) ?? {}, frame);

  const states: CharState[] = scene.characters.map((t) => {
    const cast = episode.cast.find((c) => c.id === t.castId)!;
    const placed = samplePlacement(t, frame);
    if (t.faceMovement) {
      const m = sampleMotion(t, frame, fps);
      if (m.heading !== null) placed.rotationY = lerpAngle(placed.rotationY, m.heading, clamp((m.speed - 0.02) / 0.2));
    }
    return { castId: t.castId, def: getCharacter(cast.characterId), variant: cast.variant, ...placed };
  });

  const characters = scene.characters.map((t, i) => {
    const st = states[i]!;
    const def = st.def;
    const s = modelScale(def);
    const body: ClipBody = { ...def.body, scale: s };
    const eyeY = st.position[1] + eyeHeightWorld(def);

    // resolve pointAt targets to character-local yaw/pitch (from the shoulder)
    const clips = t.clips.map((c) => {
      const target = (c.params.pointAt ?? c.params.target) as Vec3 | string | { castId: string } | undefined;
      if (target === undefined) return c;
      const p = resolveTarget(target, env, states);
      if (!p) throw new Error(`Unknown point target "${String(target)}" in environment "${env.id}"`);
      const shY = st.position[1] + (def.body.hipHeight + def.body.shoulderAboveHip) * s;
      const dx = p[0] - st.position[0];
      const dz = p[2] - st.position[2];
      let yaw = Math.atan2(dx, dz) - st.rotationY;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      const dist = Math.hypot(dx, dz, p[1] - shY);
      return { ...c, params: { ...c.params, yaw, pitch: Math.atan2(p[1] - shY, Math.hypot(dx, dz)), dist } };
    });

    const motion = sampleMotion(t, frame, fps);
    const pose = evaluatePose(frame, fps, def.seed, clips, sampleExpression(t, def, frame), body, motion, t.autoWalk);

    // look-at: head turn + eye gaze toward the most recent target, eased over 10 frames
    let look: [number, number] = [0, 0];
    const keys = [...t.lookAt].sort((a, b) => a.frame - b.frame);
    const lkIndex = keys.map((k) => k.frame <= frame).lastIndexOf(true);
    const angleTo = (target: (typeof keys)[number]["target"]): [number, number] => {
      const p = resolveTarget(target, env, states);
      if (!p) return [0, 0];
      const dx = p[0] - st.position[0];
      const dy = p[1] - (eyeY + pose.rootY * s);
      const dz = p[2] - st.position[2];
      let yaw = Math.atan2(dx, dz) - st.rotationY;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      return [clamp(yaw, -1.0, 1.0), clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.6)];
    };
    if (lkIndex >= 0) {
      const cur = angleTo(keys[lkIndex]!.target);
      const prev = lkIndex > 0 ? angleTo(keys[lkIndex - 1]!.target) : ([0, 0] as [number, number]);
      const w = progress(frame, keys[lkIndex]!.frame, keys[lkIndex]!.frame + 10, "easeInOut");
      look = [lerp(prev[0], cur[0], w), lerp(prev[1], cur[1], w)];
      // eyes lead the head: the remainder of the angle goes to gaze
      pose.face = { ...pose.face, gaze: [pose.face.gaze[0] + look[0] * 0.35, pose.face.gaze[1] + look[1] * 0.5] };
      look = [look[0] * 0.75, look[1] * 0.6];
    }

    // props
    const attachments: Attachments = {};
    for (const pr of t.props) {
      if (frame < pr.from || frame > pr.from + pr.durationInFrames) continue;
      const make = PROPS[pr.prop];
      if (!make) throw new Error(`Unknown prop "${pr.prop}"`);
      const grip = PROP_GRIPS[pr.prop] ?? { position: [0, -0.08, 0.04] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] };
      const node: ReactNode = (
        <group key={pr.prop} scale={1 / s}>
          <group position={grip.position} rotation={grip.rotation}>
            {make({ state: pr.state })}
          </group>
        </group>
      );
      attachments[pr.joint] = node;
    }

    return (
      <CharacterModel
        key={t.castId}
        def={def}
        pose={pose}
        blink={blinkAmount(frame, fps, def.seed)}
        position={st.position}
        rotationY={st.rotationY}
        look={look}
        attachments={attachments}
        variant={st.variant}
      />
    );
  });

  const paths = energy
    ? Object.entries(environmentCables(env, scene.environment.options)).map(([id, pts], i) => {
        // household consumption routes: "load:house:<appliance>" (normal circuits) and
        // "load:backup:<appliance>" (backup circuit, only while house circuits are down)
        if (id.startsWith("load:")) {
          const [, circuit, appliance] = id.split(":");
          const sw = envState[appliance!] ?? 1;
          const level = circuit === "backup" ? energy.backupPower * (1 - energy.housePower) : energy.housePower;
          return <EnergyPath key={id} points={pts} frame={frame} fps={fps} intensity={0.45 * level * sw} color="load" seed={i + 1} particleMultiplier={quality.particleMultiplier * 0.5} />;
        }
        const flowId = (id === "meter-to-house" ? "grid-to-house" : id) as FlowId;
        const flow = energy.state.flows[flowId];
        if (!flow) return null;
        const color: EnergyColorKey = flow.kind;
        return <EnergyPath key={id} points={pts} frame={frame} fps={fps} intensity={energy.intensity[flowId] ?? 0} color={color} seed={i + 1} particleMultiplier={quality.particleMultiplier} />;
      })
    : null;

  const atmosphere = scene.environment.options.atmosphere;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: quality.antialias, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: lighting.exposure }}
      dpr={1}
    >
      <CameraRig shot={shot} aspect={width / height} />
      <LightingRig preset={lighting} shadowMapSize={quality.shadowMapSize} shadowExtent={env.shadowExtent} skyVisible={env.skyVisible ?? true} />
      {env.render({ frame, fps, lighting, energy, options: scene.environment.options, state: envState })}
      {characters}
      {paths}
      {atmosphere !== false && (
        <Atmosphere
          frame={frame}
          fps={fps}
          count={Math.round((env.atmosphere?.count ?? 70) * quality.particleMultiplier)}
          center={env.atmosphere?.center}
          size={env.atmosphere?.size}
          color={lighting.interiorGlow > 0.8 ? "#C9D6FF" : "#FFE2A8"}
        />
      )}
    </ThreeCanvas>
  );
}
