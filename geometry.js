/**
 * Geometry Library
 * @author Harrison "Harxer" Balogh
 * @usage import { Segment, Line, Ray, Vector, Polygon, Point } from './Layout2D/Geometry.js'
 */

import Line from './structures/line.js'
import Polygon from './structures/polygon.js'
import Point from './structures/point.js'
import Ray from './structures/ray.js'
import Segment from './structures/segment.js'
import Vector from './structures/vector.js'

export {
  Line,
  Polygon,
  Point,
  Ray,
  Segment,
  Vector
}

export const ORIENTATION = {
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
  if (Math.abs(diff) <= threshold || Math.abs(diff) >= 2 * Math.PI - threshold) return 0
  return (diff < Math.PI && diff > 0) || (diff < - Math.PI) ? -1 : 1
}
