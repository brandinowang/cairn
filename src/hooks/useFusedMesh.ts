import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { FusedStructure, MeshData, MeshJob } from '../types';
import { fusedCacheKey } from '../engine/structure';

const MESH_CACHE_LIMIT = 24;
const meshCache = new Map<string, THREE.BufferGeometry>();

function toGeometry(data: MeshData): THREE.BufferGeometry | null {
  if (data.positions.length < 9 || data.indices.length < 3) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}

function cacheGeometry(key: string, geo: THREE.BufferGeometry): void {
  if (meshCache.has(key)) return;
  meshCache.set(key, geo);
  if (meshCache.size > MESH_CACHE_LIMIT) {
    const oldest = meshCache.keys().next().value as string;
    meshCache.get(oldest)?.dispose();
    meshCache.delete(oldest);
  }
}

function previewResolution(primitiveCount: number): number {
  if (primitiveCount > 24) return 40;
  if (primitiveCount > 14) return 44;
  return 48;
}

type WorkerReply =
  | { type: 'mesh'; cacheKey: string; data: MeshData }
  | { type: 'error'; cacheKey: string; message: string };

type PendingJob = {
  jobId: number;
  cacheKey: string;
  onDone: (msg: WorkerReply) => void;
};

let sharedWorker: Worker | null = null;
let pendingJob: PendingJob | null = null;

function getWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker(new URL('../engine/mesh.worker.ts', import.meta.url), {
      type: 'module',
    });
    sharedWorker.onmessage = (ev: MessageEvent<WorkerReply>) => {
      const msg = ev.data;
      if (!pendingJob || pendingJob.cacheKey !== msg.cacheKey) return;
      const job = pendingJob;
      pendingJob = null;
      job.onDone(msg);
    };
  }
  return sharedWorker;
}

function runMeshJob(job: MeshJob): Promise<WorkerReply> {
  return new Promise((resolve) => {
    pendingJob = {
      jobId: 0,
      cacheKey: job.cacheKey,
      onDone: resolve,
    };
    getWorker().postMessage(job);
  });
}

export function useFusedMesh(structure: FusedStructure) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const jobIdRef = useRef(0);
  const debounceRef = useRef<number>();
  const prevPrimitiveKeyRef = useRef('');
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const primitiveCount = structure.primitives.length;
  const resolution = previewResolution(primitiveCount);
  const cacheKey = `${fusedCacheKey(structure)}@${resolution}`;
  const primitiveKey = structure.primitives.map((p) => p.taskId).join(',');

  useEffect(() => {
    geometryRef.current = geometry;
  }, [geometry]);

  useEffect(() => {
    if (primitiveCount === 0) {
      setGeometry(null);
      setIsUpdating(false);
      return;
    }

    const cached = meshCache.get(cacheKey);
    if (cached) {
      setGeometry(cached);
      setIsUpdating(false);
      return;
    }

    const delay = prevPrimitiveKeyRef.current === primitiveKey ? 16 : 0;
    prevPrimitiveKeyRef.current = primitiveKey;
    clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      jobIdRef.current += 1;
      const jobId = jobIdRef.current;
      setIsUpdating(true);

      const job: MeshJob = {
        primitives: structure.primitives,
        blendK: structure.blendK,
        features: structure.features,
        resolution,
        cacheKey,
      };

      runMeshJob(job).then((msg) => {
        if (jobId !== jobIdRef.current) return;

        if (msg.type === 'mesh' && msg.data) {
          const geo = toGeometry(msg.data);
          if (geo) {
            cacheGeometry(cacheKey, geo);
            setGeometry(geo);
          }
        }
        setIsUpdating(false);
      });
    }, delay);

    return () => {
      clearTimeout(debounceRef.current);
    };
  }, [cacheKey, primitiveKey, primitiveCount, structure.blendK, resolution]);

  return { geometry, isUpdating };
}

export function clearMeshCache(): void {
  for (const geo of meshCache.values()) geo.dispose();
  meshCache.clear();
}
