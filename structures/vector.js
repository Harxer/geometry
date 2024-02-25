import { boundAngle, equals, validNumber } from '../geometry.js'
import Point from './point.js'

// TODO technically only need to preserve any 2 of the 4 properties to compute the others.

/** `this._magnitude`, `this._angle` populated */
const MAGNITUDE_ANGLE = "magnitude_angle" // magnitude, angle
/** `this._x`, `this._y` populated */
const COMPONENTS = "components" // x, y

// TODO - How to handle angle of zero-length vector?

/**
 * Structure representing a direction in space. Can be in the form of an x/y component or
 * a magnitude/angle assuming the origin is (0,0). Magnitude is always positive.
 * Zero component vectors are not allowed unless a vector is zeroed after being able
 * to preserve its angle.
 */
export default class Vector {
  /**
   * @param {int | {magnitude: int, angle: int}} arg1 X value or object of magnitude/angle.
   * @param {int?} arg2 Y value if arg1 is not an object with magnitude/angle.
   *
   * @throws if X/Y components are both zero.
   *
   * @examples
   * - `new Vector(2, 4)`
   * - `new Vector({magnitude: 5, angle: PI})`
   */
  constructor(arg1, arg2) {
    // constructor 1: arg1 - {magnitude: {int}, angle: {int}}
    if (typeof arg1 === 'object') {
      if (!validNumber(arg1.magnitude)) throw Error(`[VECTOR INIT ERROR]: Magnitude not an integer: ${arg1.magnitude}`);
      if (!Number.isFinite(arg1.angle))     throw Error(`[VECTOR INIT ERROR]: Angle not an integer: ${arg1.angle}`);
      this._magnitude = arg1.magnitude;
      this._angle = arg1.angle;
      // Maintain positive magnitude
      if (this._magnitude < 0) {
        this._magnitude *= -1;
         // TODO - Does angle bounding need to happen? Can wait until its needed in a getter or usage in `equals`. It may break TENANT-2.
        this._angle = boundAngle(arg1.angle + Math.PI);
      }
      return;
    }
    // constructor 2: arg1 {int}, arg2 {int}
    if (!validNumber(arg1)) throw Error(`[VECTOR INIT ERROR]: X component not an integer: ${arg1}`);
    if (!validNumber(arg2)) throw Error(`[VECTOR INIT ERROR]: Y component not an integer: ${arg2}`);
    if (arg1 === 0 && arg2 === 0) throw Error('Null component vector is not allowed. Use mag-angle arrangement.')
    this._x = arg1;
    this._y = arg2;
  }

  // ------------------------ Properties

  /** Structure's x component. @returns {integer} */
  get x() {
    if (this._x === undefined)  {
      if (this._magnitude === 0) {
        // Zero vectors do not memoize components to zero
        return 0;
      } else {
        this._x = this.magnitude * Math.cos(this.angle)
      }
    };
    return this._x;
  }
  set x(val) {
    if (!validNumber(val)) throw Error(`Cannot set x component to non-integer: ${val}`);
    if (equals(this._x, val)) return;
    if (val === 0 && this._y === 0) {
      // Save angle before zeroing components
      this.angle;
      this._magnitude = 0;
      this._x = undefined;
      this._y = undefined;
    } else {
      // Force compute y before clearing magnitude/angle
      this.y;
      this._angle = undefined;
      this._x = val;
      this._magnitude = undefined;
    }
  }

  /** Structure's y component. @returns {integer} */
  get y() {
    // Defer extract y component if structure only has a magnitude and angle
    if (this._y === undefined) {
      if (this._magnitude === 0) {
        // zero vectors do not memoize components to zero
        return 0;
      } else {
        this._y = this.magnitude * Math.sin(this.angle)
      }
    }
    return this._y;
  }
  set y(val) {
    if (!validNumber(val)) throw Error(`Cannot set y component to non-integer: ${val}`);
    if (equals(this._y, val)) return;
    if (val === 0 && this._x === 0) {
      // Save angle before zeroing components
      this.angle;
      this._magnitude = 0;
      this._x = undefined;
      this._y = undefined;
    } else {
      // Force compute x before clearing magnitude/angle
      this.x;
      this._angle = undefined;
      this._y = val;
      this._magnitude = undefined;
    }
  }

  /** Length of structure, assuming origin (0,0). @returns {integer} */
  get magnitude() {
    if (this._magnitude === undefined) this._magnitude = Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
    return this._magnitude;
  }
  /**
   * Update length of vector. Assigning a negative magnitude will flip the angle and
   * enforce a positive magnitude. Setting zero magnitude maintains last computable angle
   * and zeroes components.
   */
  set magnitude(val) {
    if (!validNumber(val)) throw Error(`Cannot set magnitude to non-integer: ${val}`);
    if (equals(this._magnitude, val)) return;

    if (this._magnitude !== undefined) {
      // If previous magnitude saved with components, rescale x/y components
      if (this._arrangedAs(COMPONENTS)) {
        // Preserve angle if zeroing magnitude
        if (val === 0) {
          this.angle;
          this._x = undefined;
          this._y = undefined;
        } else {
          let magnitudeScaling = val / this._magnitude;
          this._x *= magnitudeScaling;
          this._y *= magnitudeScaling;
        }
      } else {
        // defer x/y component generation
        this._x = undefined;
        this._y = undefined;
      }
    } else {
      this.angle;
      this._x = undefined;
      this._y = undefined;
    }

    // Maintain positive magnitude, flip angle
    if (this._angle !== undefined && val < 0) this.angle = boundAngle(this.angle + Math.PI)

    this._magnitude = Math.abs(val);
  }

  /** Angle of structure, assuming origin (0,0) in radians. @returns {integer} radians */
  get angle() {
    if (this._angle === undefined) {
      // Zero-length structure gives 0 angle.
      if (equals(this._x, 0) && equals(this._y, 0)) throw Error('Cannot get angle of zero vector.');
      this._angle = boundAngle(Math.atan2(this.y, this.x));
    }
    return this._angle;
  }
  set angle(val) {
    if (this._angle === val) return;
    if (!Number.isFinite(val)) throw Error(`Cannot set angle to non-integer: ${val}`);
    this._angle = boundAngle(val);
    // force magnitude generation before losing x/y components
    this.magnitude;
    this._x = undefined;
    this._y = undefined;
  }

  /** Creates a Point structure out of vector components. @returns {Point} */
  get point() {
    return new Point(this.x, this.y);
  }

  /** Copies the target of all set properties */
  get copy() {
    if (this._arrangedAs(COMPONENTS)) {
      let vectorCopy = new Vector(this._x, this._y);
      vectorCopy._magnitude = this._magnitude;
      vectorCopy._angle = this._angle;
      return vectorCopy;
    }
    let vectorCopy = new Vector({magnitude: this._magnitude, angle: this._angle});
    vectorCopy._x = this._x;
    vectorCopy._y = this._y;
    return vectorCopy;
  }

  // ------------------------ Functions

  /** Compares target's properties and peer's properties. @param {Vector} peer @returns {boolean} */
  equals(peer, precision = undefined) {
    if (this._arrangedAs(MAGNITUDE_ANGLE) && peer._arrangedAs(MAGNITUDE_ANGLE)) {
      return equals(this.magnitude, peer.magnitude, precision) && equals(this.angle, peer.angle, precision);
    }
    return equals(this.x, peer.x, precision) && equals(this.y, peer.y, precision);
  }

  /** Length of structure multipled by given constant. @param {int} val @returns {this} */
  multiplyBy(val) {
    if (this._magnitude !== undefined) this._magnitude *= val;
    if (this._x !== undefined) this._x *= val;
    if (this._y !== undefined) this._y *= val;
    return this;
  }

  /** Adds value to structure's length. @param {int} peer @returns {this} */
  extendBy(val) {
    this.magnitude += val;
    return this
  }

  /** Adds peer structure. @param {Vector} peer @returns {this} */
  add(peer) {
    this.x += peer.x;
    this.y += peer.y
    return this;
  }

  /** Subtracts peer structure. @param {Vector} peer @returns {this} */
  minus(peer) {
    this.x -= peer.x;
    this.y -= peer.y
    return this;
  }

  /** Slope of structure. @returns {int} */
  slope() {
    return (this.y / this.x);
  }

  /** Flips structure by 180deg. @returns {this} */
  flip() {
    if (this._angle !== undefined) this._angle = boundAngle(this._angle + Math.PI);
    if (this._x !== undefined) this._x *= -1;
    if (this._y !== undefined) this._y *= -1;
    return this;
  }

  /** Retrieves magnitude squared - value is not memoized. @returns {int} */
  magnitudeSqrd() {
    if (this._magnitude !== undefined) return this._magnitude * this._magnitude;
    return this._x * this._x + this._y * this._y;
  }

  /** Structure stringified for readability. @returns {string} "(x, y) D:(magnitude) A:(angle?)" */
  logString() {
    return `(${this._x}, ${this._y}) D:${this._magnitude} A:${(this._angle === undefined) ? undefined : this._angle / Math.PI * 180}`
  }

  /** Sets structure length to 1. @returns {this} */
  normalize() {
    if (this._arrangedAs(COMPONENTS)) {
      if (equals(this._x, 0)) {
        this._y = 1 * Math.sign(this._y);
        this._magnitude = 1;
      }
      if (equals(this._y, 0)) {
        this._x = 1 * Math.sign(this._x);
        this._magnitude = 1;
      }
    } else {
      this.magnitude = 1;
    }
    return this;
  }

  /** Gets quadrant of angle produced by structure, assuming origin (0,0). @returns {1 | 2 | 3 | 4} */
  quadrant() {
    if (this._arrangedAs(MAGNITUDE_ANGLE)) {
      if (this.angle >= 4.71238898038469) return 4; // > (3/2) * PI
      if (this.angle >= 3.141592653589793) return 3; // > PI
      if (this.angle >= 1.5707963267948966) return 2; // > (1/2) * PI
      return 1;
    }
    if (this.x > 0 && this.y >= 0) return 1
    if (this.x <= 0 && this.y > 0) return 2
    if (this.x < 0 && this.y <= 0) return 3
    return 4; // this.x < 0 && this.y >= 0
  }

  /** Mirrors structure across a given normal. @param {Vector} normal @returns {Vector} new structure */
  reflect(normal, elasticity = 1, friction = 1) {
    let proj = this.copy.projection(normal);
    let perp = this.copy.minus(proj);
    // apply elasticity and friction
    return perp.multiplyBy(friction).minus(proj.multiplyBy(elasticity));
  }

  /** Dot product with peer. @param {Vector} peer @returns {int} */
  dotProduct(peer) {
    return this.x * peer.x + this.y * peer.y;
  }

  /** Cross product with peer. @param {Vector} peer @returns {int} */
  crossProduct(peer) {
    return this.x * peer.y - this.y * peer.x;
  }

  /** Magnitude of this structure along peer. @param {Vector} peer @returns {Vector} new structure */
  projection(peer) {
    if (this._arrangedAs(COMPONENTS) && peer._arrangedAs(COMPONENTS)) {
      return peer.copy.multiplyBy(this.dotProduct(peer) / peer.magnitudeSqrd());
    }
    let peerNormalized = peer.copy.normalize();
    peerNormalized.magnitude = this.dotProduct(peerNormalized);
    return peerNormalized;
  }

  /** Tests structure for bisection of circle by origin and radiusSqrd.
   * @param {Point} origin of circle
   * @param {int} radius of circle
   * @returns {bool} true if structure intersects circle
   */
  intersectsCircle(origin, radius) {
    if (!Point.typeOf(origin)) {
      throw Error(`[ERROR intersectsCircle]: Provided origin is not a valid point: ${origin}`)
    }
    if (origin.x === 0 && origin.y === 0) return true;
    let proj = this.projection(new Vector(origin.x, origin.y));
    let perp = new Point(origin.x, origin.y).minus(proj);
    if (perp.x === 0 && perp.y === 0) return true;
    let dotProd = proj.dotProduct(this);

    if (dotProd < 0) return false;
    if (dotProd > this.magnitudeSqrd()) return false;

    return (perp.vector.magnitudeSqrd() < radius * radius);
  }

  /** Returns right square angle Vector of this structure. @returns {Vector} */
  normal() {
    if (this._arrangedAs(COMPONENTS)) {
      let newVector = new Vector(this.y, -this.x);
      if (this._angle !== undefined) newVector._angle = boundAngle(this._angle - Math.PI / 2);
      newVector._magnitude = this._magnitude;
      return newVector
    }
    let newVector = new Vector({magnitude: this.magnitude, angle: boundAngle(this.angle - Math.PI / 2)});
    newVector._x = this._y;
    if (this._y !== undefined) newVector._y = -this._x;
    return newVector;
  }
  /** @alias normal */
  perpendicular() {
    return this.normal();
  }

  // --------------------- Static methods

  /** Create vector from two points. */
  static fromSegment(a, b) {
    return new Vector(b.x - a.x, b.y - a.y);
  }

  // --------------------- Internal methods

  /** INTERNAL: Check for valid arrangement style */
  _arrangedAs(arrangement) {
    if (arrangement === COMPONENTS) {
      return this._x !== undefined && this._y !== undefined;
    }
    if (arrangement === MAGNITUDE_ANGLE) {
      return this._angle !== undefined && this._magnitude !== undefined;
    }
  }

  // --------------------- Deprecated

  /** @deprecated */
  multipliedBy() {throw Error('Deprecated');}
  /** @deprecated */
  plus() {throw Error('Deprecated');}
  /** @deprecated */
  flipped() {throw Error('Deprecated');}
  /** @deprecated */
  extendedBy() {throw Error('Deprecated');}
  /** @deprecated */
  normalized() { throw Error('Deprecated'); }
}
