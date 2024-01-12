/**
 * Geometry Library
 * @author Harrison "Harxer" Balogh
 * @usage import { Segment, Vector, Polygon, Point } from './Layout2D/Geometry.js'
 */

import Polygon from './structures/polygon.js'
import Point from './structures/point.js'
import Segment from './structures/segment.js'
import Vector from './structures/vector.js'

export let globalEqualsPrecision = 16;
export function setGlobalEqualsPrecision(precision) {
  if (!Number.isFinite(precision)) throw Error(`[GEOMETRY ERROR]: Precision is not an integer: ${precision}`);
  globalEqualsPrecision = precision;
}

export {
  Polygon,
  Point,
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
 * @returns 0 for collinear. 1 for cw. 2 for ccw.
 */
export function orientation(p1, p2, p3) {
  let dY_p1p2 = (p2.y - p1.y);
  let dX_p1p2 = (p2.x - p1.x);
  let dX_p2p3 = (p3.x - p2.x);
  let dY_p2p3 = (p3.y - p2.y);

  // Handle Infinity - allow `0 * Infinity === 0` rather than `=== NaN`
  if (dY_p1p2 === 0 || dX_p2p3 === 0) { dY_p1p2 = 0; dX_p2p3 = 0; }
  if (dX_p1p2 === 0 || dY_p2p3 === 0) { dX_p1p2 = 0; dY_p2p3 = 0; } // TODO dY_p2p3 === 4 is a typo?

  let val = dY_p1p2 * dX_p2p3 - dX_p1p2 * dY_p2p3;
  if (val == 0) return ORIENTATION.COLLINEAR;
  return (val > 0) ? ORIENTATION.CCW : ORIENTATION.CW
}

/** Bounds input angle. @param {int} angle radians @returns {int} radians [0, 360). */
export function boundAngle(angle) {
  let twoPi = 2 * Math.PI
  if (angle < 0) return twoPi + (angle) % twoPi
  if (angle >= twoPi) return angle % twoPi
  return angle
}

export function angleDiff(val1, val2) {
  let angle1 = boundAngle(val1)
  let angle2 = boundAngle(val2)
  let diff = boundAngle(angle2 - angle1)
  if (diff > Math.PI) diff -= 2 * Math.PI
  return diff
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

/** Compare numbers for equality. If either inputs are non-numbers, returns false. */
export function equals(x, y, precision = undefined) {
  if (x === Infinity || y === Infinity || x === -Infinity || y === -Infinity) {
    // Avoid subtracting Infinity values (NaN)
    return ((x === Infinity && y === Infinity) || (x === -Infinity && y === -Infinity));
  }
  if (!validNumber(x) || !validNumber(y)) return false;

  if (precision === undefined) {
    // Dynamic precision based on magnitude of two numbers being compared up to `globalEqualsPrecision`.
    precision = globalEqualsPrecision - valueMagnitude(Math.max(x, y));
  }
  return Math.abs(y - x) < Math.pow(10, -precision) / 2;
}

/** The smallest value floating point can handle with one whole number.
 * The higher magnitude whole number, the smaller magnitude decimal.
 * @param {int} scaleReference Provide a number here to return a more
 * accurate minimum value. This can be the number minNumber is being added
 * or compared to, and will reduce the precision of the returned value
 * relative to the magnitude of the value provided.
 * @usage `minNumber(0.5)` may return ~`1e-16`. Adding this to `0.5` will
 * result in no digit loss. But if you added 1e-16 to `500000`,
 * there would about 6 decimal places of digits removed. This matters when comparing
 * values. If you use `minNumber(500000)`, this would return a number ~`1e-10`. Adding
 * this value to `500000` would not lose any digits.
 */
export function minNumber(scaleReference = 1) {
  const MIN_WHOLE_NUMBER = 1;
  let min_floating_number = 1;
  while (true) {
    if (MIN_WHOLE_NUMBER + min_floating_number === MIN_WHOLE_NUMBER) {
      // Multiply by 10 to get the last viable number, as min_floating_number is now the first failure scenario
      return min_floating_number * 10 * Math.pow(10, valueMagnitude(scaleReference) - 1);
    }
    min_floating_number /= 10;
  }
}

export function valueMagnitude(num) {
  num = Math.abs(num);
  if (num === Infinity) return Infinity;
  if (num < 10) return 1;
  return num.toString().split('.')[0].length;
}

/** Checks if passed value is a number (allows Infinity).
 * @param {int} num to validate
 * @returns {boolean} true if num is a number/Infinity, else false
 */
export function validNumber(num) {
  if (num === Infinity || num === -Infinity) return true;
  if (Number.isFinite(num)) return true;
  return false;
}
