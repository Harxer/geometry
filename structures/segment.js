/// A segment is composed of 2 vertices.
export default class Segment {
  constructor(vertex1, vertex2) {
    if (vertex1 == undefined || vertex2 == undefined) {
      throw "Passed in undefined segment vertex?"
    }
    this._a = vertex1;
    this._b = vertex2;
    this._distance = undefined
  }

  /// Gets point A if no parameter provided. Sets A if point provided.
  a(point) {
    if (point === undefined) return this._a
    this._distance = undefined
    this._a = point
  }
  /// Gets point B if no parameter provided. Sets B if point provided.
  b(point) {
    if (point === undefined) return this._b
    this._distance = undefined
    this._b = point
  }

  // https://www.codeproject.com/Tips/862988/Find-the-Intersection-Point-of-Two-Line-Segments
  // Returns a point or undefined where the two segments intersect. If only need
  // true of false if two segments intersect, use intersects(). Will return undefined
  // if end points match
  intersectionPoint(segment) {
    if (segment instanceof Ray) {
      segment = new Segment(segment.origin, new Point(999999 * Math.cos(segment.angle) + segment.origin.x, 999999 * Math.sin(segment.angle) + segment.origin.y))
    }

    // Check for end points matching
    if (this._a.equals(segment._a) || this._a.equals(segment._b) || this._b.equals(segment._a) || this._b.equals(segment._b)) {
      return undefined;
    }
    let r = this._b.minus(this._a);
    let s = segment._b.minus(segment._a);
    let rxs = r.cross(s);
    let qpxr = (segment._a.minus(this._a)).cross(r);

    if (rxs == 0 && qpxr == 0) {
      return undefined; // collinear segments. ignoring.
    }
    if (rxs == 0 && qpxr != 0) {
      return undefined; // parallel
    }

    let t = (segment._a.minus(this._a)).cross(s) / rxs;
    let u = (segment._a.minus(this._a)).cross(r) / rxs;

    if (rxs != 0 && (0 <= t && t <= 1) && (0 <= u && u <= 1)) {
      // Intersection
      return new Point(
        (this._a.x + r.x * t),
        (this._a.y + r.y * t)
      );
    }
    return undefined; // No intersection
  }

  // Same as intersectionPoint() but returns true or false (more efficient)
  // If the segments share end points then intersection is false.
  intersects(segment) {
    if (segment instanceof Ray)
      segment = new Segment(segment.origin, new Point(999999 * Math.cos(segment.angle) + segment.origin.x, 999999 * Math.sin(segment.angle) + segment.origin.y))

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
  /// Returns segment as a Vector object.
  vector() {
    return new Vector(this._b.x - this._a.x, this._b.y - this._a.y);
  }
  /// Returns segment as a Line object.
  line() {
    return new Line(this._a, this._b);
  }
  /// Gets angle made by Segment from A to B.
  angle() {
    return Math.atan2(this._b.y - this._a.y, this._b.x - this._a.x);
  }
  /// Replaces point A with point B. And vice versa.
  flip() {
    return new Segment(this._b, this._a);
  }
  /// Checks target point A and B with passed in segment's A and B.
  equals(segment) {
    return (this._a.equals(segment._a) && this._b.equals(segment._b));
  }
  /// Stringified description of segment.
  logString() {
    return this._a.logString() + " -> " + this._b.logString();
  }
  /// The distance before square-rooting. Useful if comparing relative distances rather
  /// than needing to know the actual distance (more efficient).
  distanceSqrd() {
    if (this._distance !== undefined) return Math.pow(this._distance, 2)
    return this.vector().magnitudeSqrd();
  }
  /// The magnitude of the segment.
  distance() {
    if (this._distance !== undefined) return this._distance
    this._distance = this.vector().magnitude();
    return this._distance
  }
  /// Returns the middle point between A and B as a Point object.
  midpoint() {
    let dX = this._b.x - this._a.x
    let dY = this._b.y - this._a.y
    return new Point(this._a.x + dX/2, this._a.y + dY/2)
  }

  /**
   * Determine the side which a point lies based on direction of a segment from A to B.
   * Technically, this is the cross product between this segment and a segment from A to the point.
   * @param {Point} point The point to check which side it lies on in reference to the segment.
   * @returns {Integer} A positive value indicates the left side, a negative value the right side.
   */
  directionTo(point) {
    return this.vector().crossProduct(Vector.fromSegment(this.a(), point)) * -1
  }
  /// Returns the point on the segment which is closest to the given point.
  closestPointOnSegmentTo(point) {
    let aToPoint = new Segment(this._a, point)
    let proj = aToPoint.vector().projection(this.vector())
    // Check if closer to segments endpoints
    if (proj.quadrant() != this.vector().quadrant()) return this._a
    if (this.distanceSqrd() < proj.magnitudeSqrd()) return this._b
    return this._a.add(proj.asPoint())
  }
  /// Gets the distance between the two points before square-rooting.
  static distanceSqrd(a, b) {
    return new Segment(a, b).distanceSqrd()
  }
  /// Gets the distance between the two points.
  static distance(a, b) {
    return new Segment(a, b).distance()
  }
}