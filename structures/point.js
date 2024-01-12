import { validNumber, equals, Segment, valueMagnitude, globalEqualsPrecision } from '../geometry.js';
import Vector from './vector.js';

/** 2D Point structure */
export default class Point {
  /** Create 2D location structure.
   * @param {int} x Component
   * @param {int} y Component
   * @throws if components are not valid numbers
   */
  constructor(x, y) {
    if (!validNumber(x)) throw Error(`[POINT INIT ERROR]: X not an integer: ${x}`);
    if (!validNumber(y)) throw Error(`[POINT INIT ERROR]: Y not an integer: ${y}`);
    this._x = x;
    this._y = y;
  }

  /** Structure's x location. @returns {integer} */
  get x() {
    return this._x;
  }
  set x(val) {
    if (!validNumber(val)) throw Error(`Cannot set X to non-integer: ${val}`);
    this._x = val;
  }
  /** Structure's y location. @returns {integer} */
  get y() {
    return this._y;
  }
  set y(val) {
    if (!validNumber(val)) throw Error(`Cannot set Y to non-integer: ${val}`);
    this._y = val;
  }

  /** Copies the target x/y properties. @returns {Point} */
  get copy() {
    return new Point(this._x, this._y);
  }

  /** Creates a Vector structure out of point coordinates. @returns {Vector} */
  get vector() {
    return new Vector(this.x, this.y);
  }

  /** Compares x/y components for equility. @param {Point} peer @param {int?} precision optional @returns {boolean} */
  equals(peer, precision = undefined) {
    if (peer === undefined) return false;
    return equals(this.x, peer.x, precision) && equals(this.y, peer.y, precision);
  }

  /** Test target Point for overlap with passed Segment.
   * @param {Segment} segment
   * @returns {boolean} true if overlapping segment or its endpoints
   */
  isOnSegment(segment) {
    if (!(segment instanceof Segment)) throw Error('Non-Segment object passed')
    if (this.equals(segment.a) || this.equals(segment.b)) return true;
    if (
      this.x > Math.max(segment.a.x, segment.b.x) ||
      this.x < Math.min(segment.a.x, segment.b.x) ||
      this.y > Math.max(segment.a.y, segment.b.y) ||
      this.y < Math.min(segment.a.y, segment.b.y)) {
        return false;
    }
    let largestScale = Math.max(segment.a.x, segment.a.y, segment.b.x, segment.b.y, this.x, this.y);
    // TODO replace slope compare with quadrant compare
    if (equals((new Segment(segment.a, this)).slope, segment.slope, globalEqualsPrecision - valueMagnitude(largestScale))) return true
    return false;
  }

  /** Serializes structure to a string. @returns {string} */
  logString() {
    return `(${this.x}, ${this.y})`;
  }

  /** Gets plain JS object used for serialization. */
  json() {
    return {x: this.x, y: this.y};
  }

  /** Move point in direction of given vector. @param {Vector} vector @returns {Point} this */
  add(vector) {
    this._x += vector.x;
    this._y += vector.y;
    return this;
  }

  /** Move point in negative direction of given vector. @param {Vector} vector @returns {Point} this */
  minus(vector) {
    this._x -= vector.x;
    this._y -= vector.y;
    return this;
  }
}
