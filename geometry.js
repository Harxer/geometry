/**
 * Geometry Library
 * @author Harrison "Harxer" Balogh
 * @usage import { Segment, Line, Ray, Vector, Polygon, Point } from './Layout2D/Geometry.js'
 */

import Line from './structures/line'
import Polygon from './structures/polygon'
import Point from './structures/point'
import Ray from './structures/ray'
import Segment from './structures/segment'
import Vector from './structures/vector'

export {
  Line,
  Polygon,
  Point,
  Ray,
  Segment,
  Vector
}

const ORIENTATION = {
  COLLINEAR: 0,
  CW: 1,
  CCW: 2
}

/**
 * Returns orientation of ordered triplet.
 *
 * @returns  0 - collinear, 1 - cw, 2 - ccw
 */
export function orientation(p1, p2, p3) {
  let val = (p2.y - p1.y) * (p3.x - p2.x) -
            (p2.x - p1.x) * (p3.y - p2.y);
  if (val == 0) return ORIENTATION.COLLINEAR;
  return (val > 0) ? ORIENTATION.CW : ORIENTATION.CCW
}

/**
 * Extrude polygon vertices. An approximation of padding or "stroking" a polygon.
 */
export function extrudeVertices(vertices, extrude) {
  // return vertices;
  let extrudedVertices = [];
  for (let v = 0; v < vertices.length; v++) {
    let cV = vertices[v];
    let nV = vertices[(v+1)%vertices.length];
    let pV = vertices[(v-1) < 0 ? (vertices.length+(v-1)) : (v-1)];
    // Vectors from current vertex out to previous and next vertex.
    let pVec = (new Vector(pV.x - cV.x, cV.y - pV.y)).normalized();
    let nVec = (new Vector(nV.x - cV.x, cV.y - nV.y)).normalized();
    let angle = Math.acos(pVec.dotProduct(nVec))
    let cross = pVec.crossProduct(nVec)
    if (cross > 0) angle = 2*Math.PI - angle
    let angleBetween = angle/2 + nVec.angle();

    // Extend a point out from current vertex.
    extrudedVertices.push(
      new Point(
        cV.x + extrude * Math.cos(angleBetween),
        cV.y - extrude * Math.sin(angleBetween)
      )
    );
  }
  return extrudedVertices;
}

export function closestPointAroundVertices(vertices, start, vGoal, destination) {
  // ===== Shortest route around visible vertices
  let farthestVertexAbove = {
    vertex: undefined,
    distanceSqrd: undefined,
    quadrant: undefined
  };
  let farthestVertexBelow = {
    vertex: undefined,
    distanceSqrd: undefined
  };
  vertices.forEach(vertex => {
    // This vertex is visible from start point. Establish if its above or below target line.
    // Project the segment from start to vertex onto the target line.
    let a = new Vector(vertex.x - start.x, vertex.y - start.y);
    let proj = a.projection(vGoal);
    // Get perpendicular line out from target line at projection point.
    let perp = new Vector(
      vertex.x - (start.x + proj.x),
      vertex.y - (start.y + proj.y)
    );
    // Squared distance of this line.
    let perpDistSqrd = Math.pow(perp.x, 2) + Math.pow(perp.y, 2);
    // Find furthest above and below
    if (!farthestVertexAbove.quadrant || farthestVertexAbove.quadrant == perp.quadrant()) {
      farthestVertexAbove.quadrant = perp.quadrant();
      if (!farthestVertexAbove.distanceSqrd || perpDistSqrd > farthestVertexAbove.distanceSqrd) {
        farthestVertexAbove.vertex = vertex;
        farthestVertexAbove.distanceSqrd = perpDistSqrd;
      }
    } else if (!farthestVertexBelow.distanceSqrd || perpDistSqrd > farthestVertexBelow.distanceSqrd) {
      farthestVertexBelow.vertex = vertex;
      farthestVertexBelow.distanceSqrd = perpDistSqrd;
    }
  });
  // Determine if should go above or below object. Compares the distance (sqrd)
  // from the start to the vertex and then to the target. Uses 4 square root calculations :(
    let towards = undefined;
  if (farthestVertexBelow.vertex) {
    let distAbove = new Segment(start, farthestVertexAbove.vertex).magnitude() + new Segment(farthestVertexAbove.vertex, start.add(vGoal)).magnitude();
    let distBelow = new Segment(start, farthestVertexBelow.vertex).magnitude() + new Segment(farthestVertexBelow.vertex, start.add(vGoal)).magnitude();
    towards = distAbove < distBelow ? farthestVertexAbove : farthestVertexBelow;
  } else {
    towards = farthestVertexAbove;
  }
  return towards.vertex;
}

export function boundAngle(angle) {
  let twoPi = 2 * Math.PI
  if (angle < 0) return twoPi + (angle) % twoPi
  if (angle > twoPi) return angle % twoPi
  return angle
}

/**
 * Check value is zero. Threshold defaults to 0.0001
 * @param {int} value to check zero equality
 * @param {*int} threshold precision range
 */
export function isZero(value, threshold = 0.0001) {
  return Math.abs(value) <= threshold
}

export function angleDiff(val1, val2) {
  let angle1 = boundAngle(val1)
  let angle2 = boundAngle(val2)
  let diff = boundAngle(angle2 - angle1)
  if (diff > Math.PI) diff -= 2 * Math.PI
  return diff
}

/**
 * @param {Number} diff
 * @param {int} threshold - Default 1deg.
 * @returns
 *  - `0` if difference within threshold
 *  - `1` if val1 is larger
 *  - `-1` if val2 is larger
 */
export function diffNormalized(diff, threshold = 0.01745) {
  if (isZero(diff, threshold)) return 0
  return diff < 0 ? 1 : -1
}

export const ANGLE = {
  CLOCKWISE: 1,
  COUNTERCLOCKWISE: -1,
  EQUAL: 0
}

/**
 * Check if target vectors angle matches given vector's angle within
 * threshold. Threshold defaults to 1deg.
 * @param {Vector} peer
 * @param {int} threshold - Default 1deg
 * @returns
 *  - `0` if difference within threshold
 *  - `1` if val1 is larger
 *  - `-1` if val2 is larger
 */
export function anglesMatch(val1, val2, threshold = 0.01745) {
  let angle1 = boundAngle(val1)
  let angle2 = boundAngle(val2)
  let diff = angle1 - angle2
  if (Math.abs(diff) <= threshold || Math.abs(diff) >= 2 * Math.PI - thershold) return 0
  return (diff < Math.PI && diff > 0) || (diff < - Math.PI) ? -1 : 1
}
