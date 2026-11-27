/**
 * Generic 3D scene renderer. Reads one validated Scene + cast and renders
 * environment, lighting, camera, characters and energy flows for the
 * current frame. Contains NO episode-specific logic.
 */
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { Episode, Scene, Vec3 } from "../../schemas/episode";
import { blinkAmount, sampleTrack, lerpVec3, lerpAngle, lerp, clamp } from "../animation/core";
import { evaluatePose } from "../animation/clips";
import { getCharacter } from "../characters/library";
import { Humanoid } from "../characters/Humanoid";
import { CameraRig, sampleCamera, type CameraShot } from "../cameras/CameraRig";
import { getCameraPreset } from "../cameras/presets";
import { getEnvironment } from "../environments/registry";
import { LightingRig } from "../lighting/LightingRig";
import { getLightingPreset } from "../lighting/presets";
import { EnergyPath } from "../energy-flow/EnergyPath";
import { sampleElectrical } from "../energy-flow/timeline";
import type { FlowId } from "../energy-flow/scenario";
import type { EnergyColorKey } from "../../config/palette";
import { Atmosphere } from "../core/Atmosphere";
import type { QualityPreset } from "../../config/formats";
import type { Keyframe } from "../animation/core";

const HEAD_HEIGHT = 1.75;

interface CharState {
  castId: string;
  position: Vec3;
  rotationY: number;
}

const shoulderWorld = (st: CharState): Vec3 => [st.position[0], st.position[1] + 1.45, st.position[2]];

export function cameraKeysForScene(scene: Scene, focus: Vec3): Keyframe<CameraShot>[] {
  if (scene.camera.keyframes.length > 0) {
    return scene.camera.keyframes.map((k) => ({ frame: k.frame, value: { position: k.position, target: k.target, fov: k.fov ?? 40 }, easing: k.easing }));
  }
  return getCameraPreset(scene.camera.preset ?? "establishing-wide")({ focus, durationInFrames: scene.durationInFrames });
}

export function SceneView({ scene, episode, quality }: { scene: Scene; episode: Episode; quality: QualityPreset }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const env = getEnvironment(scene.environment.id);
  const lighting = getLightingPreset(scene.lighting.preset);
  const shot = sampleCamera(cameraKeysForScene(scene, env.focus), frame);
  const energy = sampleElectrical(scene.electrical, frame);

  // ---- character placement (needed first for look-at between characters)
  const states: CharState[] = scene.characters.map((t) => {
    const s = sampleTrack(
      t.keyframes.map((k, i) => ({
        frame: k.frame,
        easing: k.easing,
        value: { p: k.position ?? t.keyframes.slice(0, i).reverse().find((x) => x.position)?.position ?? [0, 0, 0], r: k.rotationY ?? 0 },
      })),
      frame,
      (a, b, w) => ({ p: lerpVec3(a.p as Vec3, b.p as Vec3, w), r: lerpAngle(a.r, b.r, w) }),
    );
    return { castId: t.castId, position: s.p as Vec3, rotationY: s.r };
  });

  const characters = scene.characters.map((t, i) => {
    const cast = episode.cast.find((c) => c.id === t.castId)!;
    const def = getCharacter(cast.characterId);
    const st = states[i]!;
    // resolve clip targets (pointAt: anchor name or world position) to local yaw/pitch
    const clips = t.clips.map((c) => {
      const target = c.params.pointAt;
      if (target === undefined) return c;
      const p: Vec3 | undefined = typeof target === "string" ? env.anchors[target] : (target as Vec3);
      if (!p) throw new Error(`Unknown anchor "${String(target)}" in environment "${env.id}"`);
      const sh = shoulderWorld(st);
      const dx = p[0] - sh[0];
      const dz = p[2] - sh[2];
      let yaw = Math.atan2(dx, dz) - st.rotationY;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      const pitch = Math.atan2(p[1] - sh[1], Math.hypot(dx, dz));
      return { ...c, params: { ...c.params, yaw, pitch } };
    });
    const pose = evaluatePose(frame, fps, def.seed, clips);
    // look-at: most recent target at or before this frame
    let look: [number, number] = [0, 0];
    const lk = [...t.lookAt].sort((a, b) => a.frame - b.frame).filter((l) => l.frame <= frame).pop();
    if (lk) {
      const target: Vec3 = typeof lk.target === "string"
        ? (env.anchors[lk.target] ?? [0, HEAD_HEIGHT, 10])
        : Array.isArray(lk.target)
        ? (lk.target as Vec3)
        : (() => {
            const o = states.find((s) => s.castId === (lk.target as { castId: string }).castId);
            return o ? ([o.position[0], HEAD_HEIGHT, o.position[2]] as Vec3) : ([0, HEAD_HEIGHT, 10] as Vec3);
          })();
      const dx = target[0] - st.position[0];
      const dy = target[1] - (st.position[1] + HEAD_HEIGHT);
      const dz = target[2] - st.position[2];
      let yaw = Math.atan2(dx, dz) - st.rotationY;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      const pitch = Math.atan2(dy, Math.hypot(dx, dz));
      const ease = clamp((frame - lk.frame) / 10);
      look = [lerp(0, clamp(yaw, -0.9, 0.9), ease), lerp(0, clamp(pitch, -0.5, 0.6), ease)];
    }
    return (
      <Humanoid key={t.castId} def={def} pose={pose} blink={blinkAmount(frame, fps, def.seed)} position={st.position} rotationY={st.rotationY} look={look} />
    );
  });

  // ---- energy paths derived from the electrical state
  const paths = energy
    ? Object.entries(env.cables).map(([id, pts], i) => {
        const flowId = (id === "meter-to-house" ? "grid-to-house" : id) as FlowId;
        const flow = energy.state.flows[flowId];
        if (!flow) return null;
        const color: EnergyColorKey = flow.kind;
        return (
          <EnergyPath
            key={id}
            points={pts}
            frame={frame}
            fps={fps}
            intensity={energy.intensity[flowId] ?? 0}
            color={color}
            seed={i + 1}
            particleMultiplier={quality.particleMultiplier}
          />
        );
      })
    : null;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: quality.antialias, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: lighting.exposure }}
      dpr={1}
    >
      <CameraRig shot={shot} aspect={width / height} />
      <LightingRig preset={lighting} shadowMapSize={quality.shadowMapSize} />
      {env.render({ frame, fps, lighting, energy, options: scene.environment.options })}
      {characters}
      {paths}
      {scene.environment.options.atmosphere !== false && (
        <Atmosphere frame={frame} fps={fps} count={Math.round(70 * quality.particleMultiplier)} color={lighting.interiorGlow > 0.8 ? "#C9D6FF" : "#FFE2A8"} />
      )}
    </ThreeCanvas>
  );
}
