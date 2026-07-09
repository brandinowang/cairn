declare module 'd3-delaunay' {
  export class Delaunay {
    static from(points: ArrayLike<[number, number]> | Iterable<[number, number]>): Delaunay;
    voronoi(bounds?: [number, number, number, number]): {
      cellPolygon(i: number): [number, number][] | null;
    };
  }
}
