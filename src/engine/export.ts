import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { meshField } from './mesh';
import { buildVoronoiCellGeometry } from './voronoi';
import type { FieldPrimitive, FusedStructure, VoronoiCell } from '../types';

export const MM_SCALE = 10;
const EXPORT_RES = 128;

function downloadBlob(data: BlobPart, filename: string): void {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function meshDataToThree(data: {
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  return geo;
}

function exportMeshesToSTL(meshes: THREE.Mesh[], filename: string): void {
  const group = new THREE.Group();
  for (const mesh of meshes) {
    const clone = mesh.clone();
    clone.applyMatrix4(mesh.matrix);
    group.add(clone);
  }
  group.updateMatrixWorld(true);
  const exporter = new STLExporter();
  const result = exporter.parse(group, { binary: true });
  downloadBlob(result, filename);
}

export function exportFusedSTL(structure: FusedStructure): void {
  const data = meshField(
    structure.primitives,
    structure.blendK,
    structure.features,
    EXPORT_RES,
  );
  const geo = meshDataToThree(data);
  const mesh = new THREE.Mesh(geo);
  mesh.scale.setScalar(MM_SCALE);
  mesh.updateMatrix();
  exportMeshesToSTL([mesh], `CAIRN_${structure.serial}_fused.stl`);
}

export function exportIsolatedPrimitiveSTL(params: FieldPrimitive, serial: string): void {
  const positioned = { ...params, position: [0, params.mass * params.aspect * 0.18, 0] as [number, number, number] };
  const data = meshField([positioned], 0.05, { flattenBase: true, boreRadius: 0, mirrorX: false, concavity: 0 }, 96);
  const geo = meshDataToThree(data);
  const mesh = new THREE.Mesh(geo);
  mesh.scale.setScalar(MM_SCALE);
  mesh.updateMatrix();
  exportMeshesToSTL([mesh], `CAIRN_${serial}_${params.type}.stl`);
}

export function voronoiCellToMesh(cell: VoronoiCell): THREE.Mesh {
  const geo = buildVoronoiCellGeometry(cell);
  const mesh = new THREE.Mesh(geo.clone());
  mesh.position.set(...cell.position);
  mesh.scale.setScalar(MM_SCALE);
  mesh.updateMatrix();
  return mesh;
}

export function exportVoronoiSTL(cells: VoronoiCell[], serial: string): void {
  exportMeshesToSTL(
    cells.map(voronoiCellToMesh),
    `CAIRN_${serial}_voronoi.stl`,
  );
}

export function captureCanvasPNG(canvas: HTMLCanvasElement, scale = 2): void {
  const w = canvas.width;
  const h = canvas.height;
  const off = document.createElement('canvas');
  off.width = w * scale;
  off.height = h * scale;
  const ctx = off.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);
  off.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, `CAIRN_capture_${Date.now()}.png`);
  }, 'image/png');
}
