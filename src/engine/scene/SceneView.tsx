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
import { evaluatePose, type ClipBody } from "../animation/clips";
import { getCharacter } from "../characters/library";
import { CharacterModel, eyeHeightWorld, modelScale } from "../characters/CharacterModel";
import { getExpression } from "../characters/expressions";
import { blendFaces, type FaceState } from "../characters/rig";
import type { Attachments } from "../characters/parts";
import type { CharacterDefinition } from "../characters/types";
import { CameraRig, sampleCamera, type CameraShot } from "../cameras/CameraRig";
import { getCameraPreset } from "../cameras/presets";
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
  const shot = sampleCamera(cameraKeysForScene(scene, env.focus), frame);
  const energy = sampleElectrical(scene.electrical, frame);
  const envState = sampleEnvironmentState(scene, env.defaultState?.(lighting, energy) ?? {}, frame);

  const states: CharState[] = scene.characters.map((t) => {
    const cast = episode.cast.find((c) => c.id === t.castId)!;
    return { castId: t.castId, def: getCharacter(cast.characterId), ...samplePlacement(t, frame) };
  });

  const characters = scene.characters.map((t, i) => {
    const st = states[i]!;
    const def = st.def;
    const s = modelScale(def);
    const body: ClipBody = { ...def.body, scale: s };
    const eyeY = st.position[1] + eyeHeightWorld(def);

    // resolve pointAt targets to character-local yaw/pitch (from the shoulder)
    const clips = t.clips.map((c) => {
      const target = c.params.pointAt as Vec3 | string | undefined;
      if (target === undefined) return c;
      const p = resolveTarget(target, env, states);
      if (!p) throw new Error(`Unknown point target "${String(target)}" in environment "${env.id}"`);
      const shY = st.position[1] + (def.body.hipHeight + def.body.shoulderAboveHip) * s;
      const dx = p[0] - st.position[0];
      const dz = p[2] - st.position[2];
      let yaw = Math.atan2(dx, dz) - st.rotationY;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      return { ...c, params: { ...c.params, yaw, pitch: Math.atan2(p[1] - shY, Math.hypot(dx, dz)) } };
    });

    const pose = evaluatePose(frame, fps, def.seed, clips, sampleExpression(t, def, frame), body);

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
      />
    );
  });

  const paths = energy
    ? Object.entries(environmentCables(env, scene.environment.options)).map(([id, pts], i) => {
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
