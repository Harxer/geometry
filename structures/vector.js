/// A vector is a point with a direction. This vector is a segment where vertex1
/// is (0,0) and vertex2 is (x,y). Components/magnitude/angle properties are cached.
export default class Vector {
  constructor(x, y) {
    this._x = x
    this._y = y
    this._magnitude = undefined
    this._angle = undefined
  }

  /// Getter if 'val' is not provided, setter if 'val' is provided
  x(val) {
    if (val !== undefined && val != this._x) {
      if (this._y === undefined) throw `Cannot set a vector's x component when its y component is undefined (in magnitude/angle mode). Create new vector.`
      this._magnitude = undefined
      this._angle = undefined
      this._x = val
    }
    if (this._x === undefined) this._x = this.magnitude() * Math.cos(this.angle())
    if (Number.isNaN(this._x)) throw `x component is NaN for V:${this.logString()}`
    return this._x
  }
  /// Getter if 'val' is not provided, setter if 'val' is provided
  y(val) {
    if (val !== undefined && val != this._y) {
      if (this._x === undefined) throw `Cannot set a vector's y component when its x component is undefined (in magnitude/angle mode). Create new vector.`
      this._magnitude = undefined
      this._angle = undefined
      this._y = val
    }
    if (this._y === undefined) this._y = this.magnitude() * Math.sin(this.angle())
    if (Number.isNaN(this._y)) throw `x component is NaN for V:${this.logString()}`
    return this._y
  }
  /// Getter if 'val' is not provided (magnitude returned), setter if 'val' is provided (Vector returned)
  magnitude(val) {
    if (val !== undefined && val !== this._magnitude) {
      if (this._magnitude > 0 && this._x !== undefined && this._y !== undefined) {
        if (this._angle === undefined && val == 0) this.angle()
        this._x *= val / this._magnitude
        this._y *= val / this._magnitude
      } else {
        this.angle()
        this._x = undefined
        this._y = undefined
      }
      this._magnitude = val
      return this
    }
    if (this._magnitude === undefined) {
      if (this._x === undefined) throw `x component and magnitude are undefined for V:${this.logString()}`
      if (this._y === undefined) throw `y component and magnitude are undefined for V:${this.logString()}`
      this._magnitude = Math.sqrt(Math.pow(this.x(), 2) + Math.pow(this.y(), 2))
    }
    if (Number.isNaN(this._magnitude)) throw `magnitude is NaN for V:${this.logString()}`
    return this._magnitude
  }
  /// Getter if 'val' is not provided, setter if 'val' is provided
  angle(val) {
    if (val !== undefined && val != this._angle) {
      this.magnitude()
      this._x = undefined
      this._y = undefined
      this._angle = val
    }
    if (this._angle === undefined) {
      if (this.x() == 0 && this.y() == 0) {
        this._angle = 0
      } else {
        this._angle = Math.atan2(this.y(), this.x())
      }
    }
    if (Number.isNaN(this._angle)) throw `angle is NaN for V:${this.logString()}`
    return this._angle
  }

  multipliedBy(mult) {
    if (this._magnitude !== undefined && this._angle !== undefined) {
      return Vector.fromMagnitudeAngle(this.magnitude() * mult, this.angle())
    } else {
      let vec = new Vector(this.x() * mult, this.y() * mult);
      if (this._magnitude !== undefined) vec._magnitude = this.magnitude() * mult
      if (this._angle !== undefined) vec.angle(this.angle())
      return vec
    }
  }
  /// Does not modify target vector
  plus(vec) {
    return new Vector(vec.x() + this.x(), vec.y() + this.y())
  }
  /// Does not modify target vector
  flipped() {
    let newVec = new Vector()
    if (this._magnitude !== undefined) newVec._magnitude = this._magnitude
    if (this._x !== undefined) newVec._x = -this._x
    if (this._y !== undefined) newVec._y = -this._y
    if (this._angle !== undefined) newVec._angle = boundAngle(this._angle + Math.PI)
    return newVec
  }
  /// Modifies target vector
  flip() {
    if (this._angle !== undefined) this._angle = boundAngle(this._angle + Math.PI)
    if (this._x !== undefined) this._x = -this._x
    if (this._y !== undefined) this._y = -this._y
    return this
  }
  /// Does not modify target vector
  minus(vec) {
    return this.plus(vec.flipped())
  }
  magnitudeSqrd() {
    if (this._magnitude !== undefined) return this._magnitude * this._magnitude
    return this.x() * this.x() + this.y() * this.y()
  }
  logString() {
    return `(${this._x}, ${this._y}) D:${this._magnitude} A:${(this._angle === undefined) ? undefined : this._angle / Math.PI * 180}`
  }
  // Return quadrant 1, 2, 3, or 4
  quadrant() {
    if (this.x() >= 0 && this.y() >= 0) return 1
    if (this.x() >= 0 && this.y() < 0) return 2
    if (this.x() < 0 && this.y() < 0) return 3
    if (this.x() < 0 && this.y() >= 0) return 4
    return 0;
  }
  asPoint() {
    return new Point(this.x(), this.y())
  }
  asSegment() {
    return new Segment(new Point(0, 0), this.asPoint())
  }
  normalized() {
    this.magnitude(1)
    return this
  }
  // this.equals = function (point) {
  //   return (this.x == point.x && this.y == point.y);
  // };
  // this.segmentFromOrigin = function (origin) {
  //   return new Segment(origin, new Point(origin.x + this.x, origin.y + this.y));
  // };
  // this.add = function(origin) {
  //   return new Point(origin.x + this.x, origin.y + this.y);
  // }
  extendBy(magnitude) {
    this.magnitude(this.magnitude() + magnitude)
    return this
  }

  extendedBy(magnitude) {
    return new Vector(this.x(), this.y()).extendBy(magnitude)
  }

  dotProduct(peer) {
    return this.x() * peer.x() + this.y() * peer.y();
  }

  crossProduct(peer) {
    return this.x() * peer.y() - this.y() * peer.x();
  }

  projection(peer) {
    let calc = this.dotProduct(peer) / (peer.x() * peer.x() + peer.y() * peer.y());
    return new Vector(peer.x() * calc, peer.y() * calc);
  }

  intersectsCircle(center, radiusSqrd) {
    center = new Vector(center.x(), center.y())
    let proj = center.projection(this)
    let perp = center.minus(proj)
    let dotProd = proj.dotProduct(target);

    if (dotProd < 0) return false;
    if (dotProd > this.magnitudeSqrd()) return false;

    return (perp.magnitudeSqrd() < radiusSqrd);
  }

  /** Tests for magnitude being zero. Default threshold is 1deg.  */
  isZero(threshold = 0.0174532925) {
    return isZero(this.magnitudeSqrd(), threshold * threshold)
  }

  static fromSegment(a, b) {
    return new Vector(b.x - a.x, b.y - a.y);
  }
  static fromMagnitudeAngle(magnitude, angle) {
    let v = new Vector()
    v._angle = angle
    v._magnitude = magnitude
    return v
  }
}