import { meshField } from './mesh';
import type { MeshJob, MeshData } from '../types';

export type WorkerOut =
  | { type: 'mesh'; cacheKey: string; data: MeshData }
  | { type: 'error'; cacheKey: string; message: string };

self.onmessage = (ev: MessageEvent<MeshJob>) => {
  const job = ev.data;
  try {
    const data = meshField(job.primitives, job.blendK, job.features, job.resolution);
    if (data.positions.length === 0) {
      const out: WorkerOut = {
        type: 'error',
        cacheKey: job.cacheKey,
        message: 'empty mesh',
      };
      (self as unknown as Worker).postMessage(out);
      return;
    }

    const out: WorkerOut = { type: 'mesh', cacheKey: job.cacheKey, data };
    (self as unknown as Worker).postMessage(out, [
      data.positions.buffer,
      data.indices.buffer,
      data.normals.buffer,
    ]);
  } catch (err) {
    const out: WorkerOut = {
      type: 'error',
      cacheKey: job.cacheKey,
      message: err instanceof Error ? err.message : 'mesh failed',
    };
    (self as unknown as Worker).postMessage(out);
  }
};
