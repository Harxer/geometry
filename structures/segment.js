import Point from './point.js'
import Vector from './vector.js'
import { orientation, ORIENTATION, validNumber } from '../geometry.js'

// TODO can be arranged as two points or Point/Vector

/** `this._a`, `this._b` populated */
const POINT_TO_POINT = "point_to_point";
/** `this._a`, `this._vector` populated */
const POINT_VECTOR = "point_vector";

/**
 * Structure representing a line bounded by two vertices. Vertices for construction
 * can be Point structures (or object with x/y keys with numeric value). Vertex 2 (or "B")
 * can be a vector in which case the Vertex (or "A") will be treated as the origin.
 * TODO ? Structure endpoints A and B are stored as frozen copies of Points.
 * Getting A or B will return frozen Point copies to raise an error (in strict mode)
 * when attempting to manipulate endpoints.
 */
export default class Segment {
  /**
   * @param {Point | {x: int, y: int}} vertex1
   * @param {Point | {x: int, y: int} | Vector | {magnitude: int, angle: int}} vertex2
   */
  constructor(vertex1, vertex2) {
    if (vertex1 instanceof Point) {
      vertex1 = vertex1.copy;
    } else if (typeof vertex1 === 'object' && vertex1.x !== undefined && vertex1.y !== undefined) {
      if (!validNumber(vertex1.x)) throw `[SEGMENT INIT ERROR]: Vertex 1 X not an integer: ${vertex1.x}`;
      if (!validNumber(vertex1.y)) throw `[SEGMENT INIT ERROR]: Vertex 1 Y not an integer: ${vertex1.y}`;
      vertex1 = new Point(vertex1.x, vertex1.y);
    } else {
      throw `[SEGMENT INIT ERROR]: Vertex 1 not viable construction point: ${vertex1}`;
    }
    this._a = vertex1;
    Object.freeze(this._a);

    if (vertex2 instanceof Point) {
      this._b = vertex2.copy;
      Object.freeze(this._b);
    } else if (vertex2 instanceof Vector) {
      this._vector = vertex2.copy;
    } else if (typeof vertex2 === 'object') {
      if (vertex2.x !== undefined && vertex2.y !== undefined) {
        if (!validNumber(vertex2.x)) throw `[SEGMENT INIT ERROR]: Vertex 2 X not an integer: ${vertex2.x}`;
        if (!validNumber(vertex2.y)) throw `[SEGMENT INIT ERROR]: Vertex 2 Y not an integer: ${vertex2.y}`;
        this._b = new Point(vertex2.x, vertex2.y);
        Object.freeze(this._b);
      } else if (vertex2.magnitude !== undefined && vertex2.angle !== undefined) {
        this._vector = new Vector(vertex2);
      } else {
        throw `[SEGMENT INIT ERROR]: Vertex 2 not viable construction point: ${vertex2}`;
      }
    } else {
      throw `[SEGMENT INIT ERROR]: Vertex 2 not viable construction point: ${vertex2}`;
    }

    // TODO - should throw on segment a === b? disallow zero magnitude?
  }

  // ------------------------ Properties

  /** Origin vertex of structure. @returns {Point} Immutable (frozen) */
  get a() {
    return this._a;
  }
  set a(val) {
    if (!(val instanceof Point)) throw `[ERROR ASSIGN origin]: Non-point vertex: ${val}`;
    this.b; // Force `b` generation if moving `a` as this invalidates `_vector`.
    this._vector = undefined;
    this._a = val;
  }

  /** @alias a */
  get origin() { return this.a; }
  set origin(val) { this.a = val; }

  /** Target vertex of segment. @returns {Point} Immutable (frozen) */
  get b() {
    this._b ??= this._a.copy.add(this._vector);
    return this._b;
  }
  set b(val) {
    if (!(val instanceof Point)) throw `[ERROR ASSIGN target]: Non-point vertex: ${val}`;
    this._b = val;
    this._vector = undefined;
  }

  /** Structure as a vector from A to B with origin (0,0). @returns {Vector} Origin (0,0). */
  get vector() {
    this._vector ??= this._b.copy.minus(this._a).vector;
    return this._vector;
  }
  set vector(_) { throw "Cannot set vector of a Segment structure." }

  /** Length of segment. @returns {int} */
  get magnitude() { return this.vector.magnitude; }
  set magnitude(_) { throw "Cannot set magnitude of a Segment structure." }
  /** @alias magnitude */
  get distance() { return this.magnitude; }
  set distance(_) { throw "Cannot set distance of a Segment structure." }
  /** @alias magnitude */
  get length() { return this.magnitude; }
  set length(_) { throw "Cannot set length of a Segment structure." }

  /** Get structure angle from A to B. @returns {Int} Radians */
  get angle() { return this.vector.angle; }
  set angle(_) { throw "Cannot set angle of a Segment structure." }

  /** Copies segments available properties . @returns {Segment} */
  get copy() {
    let copySegment;
    if (this._arrangedAs(POINT_TO_POINT)) {
      copySegment = new Segment(this._a, this._b);
    } else {
      copySegment = new Segment(this._a, this._vector);
    }
    return copySegment
  }

  get slope() {
    return (this.b.y - this.a.y) / (this.b.x - this.a.x);
  }
  set slope(_) { throw 'Cannot set slope of a Segment structure.' }

  // ------------------------ Functions

  /** Swaps structure's endpoints. `b` becomes the new origin. @returns {this} */
  flip() {
    let hold = this._a;
    this._a = this._b;
    this._b = hold;
    if (this._vector !== undefined) this.vector.flip();
    return this;
  }

  /** Checks target's A and B with peer's A and B. @param {Segment} peer @returns {boolean} */
  equals(peer, precision = undefined) {
    return this._a.equals(peer._a, precision) && this._b.equals(peer._b, precision);
  }

  /** Structure stringified for readability. @returns {string} "(x,y) -> (x,y)" or "(x,y) plus <vector>" */
  logString() {
    if (this._arrangedAs(POINT_TO_POINT)) {
      return this._a.logString() + " -> " + this._b.logString();
    }
    return this._a.logString() + " plus " + this._vector.logString();
  }

  /** Middle point between A and B. @returns {Point} */
  midpoint() {
    let dX = this.b.x - this._a.x
    let dY = this.b.y - this._a.y
    return new Point(this._a.x + dX/2, this._a.y + dY/2)
  }

  /** Retrieves length squared. Useful if comparing relative distances. Faster than getting `distance`. @returns {int} */
  distanceSqrd() {
    return this.vector.magnitudeSqrd();
  }

  // https://www.codeproject.com/Tips/862988/Find-the-Intersection-Point-of-Two-Line-Segments
  // Returns a point or undefined where the two segments intersect. If only need
  // true of false if two segments intersect, use intersects(). Will return undefined
  // if end points match
  intersectionPoint(segment) {
    // Check for end points matching
    if (this.a.equals(segment.a) || this.a.equals(segment.b)) {
      return this.a.copy; // shared endpoints
    }
    if (this.b.equals(segment.a) || this.b.equals(segment.b)) {
      return this.b.copy; // shared endpoints
    }

    let vOrigins = segment.a.copy.minus(this.a).vector;
    let cross = this.vector.crossProduct(segment.vector);
    let crossOrigin = vOrigins.crossProduct(this.vector);

    if (cross == 0 && crossOrigin == 0) {
      return undefined; // collinear segments
    }
    if (cross == 0 && crossOrigin != 0) {
      return undefined; // parallel
    }

    let t = vOrigins.crossProduct(segment.vector) / cross;
    let u = crossOrigin / cross;

    if (cross != 0 && (0 <= t && t <= 1) && (0 <= u && u <= 1)) {
      return new Point( // Intersection
        (this.a.x + this.vector.x * t),
        (this.a.y + this.vector.y * t)
      );
    }
    return undefined; // No intersection
  }

  /** Check for segment overlap. Faster than `intersectionPoint()`.
   * @param {Segment} segment
   * @returns {boolean} true if segments overlap including endpoints
   */
  intersects(segment) {
    let o1 = orientation(this._a, this._b, segment._a);
    let o2 = orientation(this._a, this._b, segment._b);
    let o3 = orientation(segment._a, segment._b, this._a);
    let o4 = orientation(segment._a, segment._b, this._b);
    // General Cases:
    if (o1 != o2 && o3 != o4) return true
    // Special Cases:
    if (o1 == ORIENTATION.COLLINEAR && segment._a.isOnSegment(this)) return true;
    if (o2 == ORIENTATION.COLLINEAR && segment._b.isOnSegment(this)) return true;
    if (o3 == ORIENTATION.COLLINEAR && this._a.isOnSegment(segment)) return true;
    if (o4 == ORIENTATION.COLLINEAR && this._b.isOnSegment(segment)) return true;
    // Doesn't satisfy any cases:
    return false;
  }

  /**
   * Determine the side which a point lies based on direction of a segment from A to B.
   * Technically, this is the cross product between this segment and a segment from A to the point.
   * @param {Point} point The point to check which side it lies on in reference to the segment.
   * @returns {Integer} A positive value (1) indicates the left side, a negative value (-1) the right side. 0 if point lies on the segment.
   */
  directionTo(point) {
    let cross = this.vector.crossProduct(Vector.fromSegment(this._a, point));
    if (cross > 0) return 1;
    if (cross < 0) return -1;
    return 0;
  }

  /** Compute point on Segment closest to given point. @param {Point} point @returns {Point} */
  closestPointOnSegmentTo(point) {
    let aToPoint = new Segment(this._a, point);
    let proj = aToPoint.vector.projection(this.vector);
    // Check if closer to segments endpoints
    if (proj.quadrant() != this.vector.quadrant()) return this._a;
    if (this.distanceSqrd() < proj.magnitudeSqrd()) return this._b;
    return this._a.copy.add(proj);
  }

  // --------------------- Static methods

  /** Retrieves length squared between points. @param {Point} a @param {Point} b @returns {int} Length squared */
  static distanceSqrd(a, b) {
    return new Segment(a, b).distanceSqrd();
  }

  /** Retrieves length between points. @param {Point} a @param {Point} b @returns {int} Length */
  static distance(a, b) {
    return new Segment(a, b).distance;
  }

  // --------------------- Internal methods

  /** INTERNAL: Check for valid arrangement style */
  _arrangedAs(arrangement) {
    if (arrangement === POINT_TO_POINT) {
      return this._a !== undefined && this._b !== undefined;
    }
    if (arrangement === POINT_VECTOR) {
      return this._a !== undefined && this._vector !== undefined;
    }
  }
}
