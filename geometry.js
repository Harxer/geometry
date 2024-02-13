/**
 * Geometry Library
 * @author Harrison "Harxer" Balogh
 * @usage import { Segment, Vector, Polygon, Point } from './Layout2D/Geometry.js'
 */

import Polygon from './structures/polygon.js'
import Point from './structures/point.js'
import Segment from './structures/segment.js'
import Vector from './structures/vector.js'

/** Highest inverse order of magnitude precision for JS numbers. */
export const MAX_FLOAT_PRECISION = 16;

/**
 * Equality check inverse order of magnitude for floating points. Override with `setGlobalEqualsPrecision()`.
 * Default to three orders of magnitude lower than max JS float point precision.
 */
export let globalEqualsPrecision = MAX_FLOAT_PRECISION - 3;

/** Override the default 16 decimal places of precision check. */
export function setGlobalEqualsPrecision(precision) {
  if (!Number.isFinite(precision)) throw Error(`[GEOMETRY ERROR]: Precision is not an integer: ${precision}`);
  globalEqualsPrecision = precision;
}

/** Pre-computed precision comparator values. "Number.EPSILON * Math.pow(10, 16 - precision)" */
const PRECISION_MAP = {
  0: 2.220446049250313,
  1: 0.2220446049250313,
  2: 0.02220446049250313,
  3: 0.002220446049250313,
  4: 0.0002220446049250313,
  5: 0.00002220446049250313,
  6: 0.000002220446049250313,
  7: 2.220446049250313e-7,
  8: 2.220446049250313e-8,
  9: 2.220446049250313e-9,
  10: 2.220446049250313e-10,
  11: 2.220446049250313e-11,
  12: 2.220446049250313e-12,
  13: 2.220446049250313e-13,
  14: 2.220446049250313e-14,
  15: 2.220446049250313e-15,
  16: 2.220446049250313e-16, // Number.EPSILON
}

export {
  Polygon,
  Point,
  Segment,
  Vector
}

export const ORIENTATION = {
  CCW: -1,
  COLLINEAR: 0,
  CW: 1
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
  if (equals(dY_p1p2, 0) || equals(dX_p2p3, 0)) { dY_p1p2 = 0; dX_p2p3 = 0; }
  if (equals(dX_p1p2, 0) || equals(dY_p2p3, 0)) { dX_p1p2 = 0; dY_p2p3 = 0; } // TODO dY_p2p3 === 4 is a typo?

  let val = dY_p1p2 * dX_p2p3 - dX_p1p2 * dY_p2p3;
  if (equals(val, 0)) return ORIENTATION.COLLINEAR;
  return (val > 0) ? ORIENTATION.CCW : ORIENTATION.CW
}

/**
 * Clamps input angle.
 * @note The returned value, despite being small, will have the floating point precision of the incoming argument.
 * @param {int} angle radians
 * @returns {int} radians [0, 2PI).
 */
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
    // TODO - Math.max(), if values are significantly different magnitudes, why refine precision?
    precision = globalEqualsPrecision - magnitudeOrder(Math.max(Math.abs(x), Math.abs(y))) + 1;
  }
  // Less than "Math.pow(10, -) / 2":
  return Math.abs(y - x) < PRECISION_MAP[Math.max(precision, 0)];
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
  return Number.EPSILON * Math.pow(10, magnitudeOrder(scaleReference) - 1);
}

/** Precision order of magnitude for given number. @param {int} num to process. @returns {int} */
export function magnitudeOrder(num) {
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
