export default class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.equals = function(point) {
      return (this.x == point.x && this.y == point.y);
    }
    this.isOnSegmentPoints = function(a, b) {
      if (!(a instanceof Point) || !(b instanceof Point)) throw "Non-Point objects passed"
      if (
        this.x <= Math.max(a.x, b.x) &&
        this.x >= Math.min(a.x, b.x) &&
        this.y <= Math.max(a.y, b.y) &&
        this.y >= Math.min(a.y, b.y)) {
          return true;
      }
      return false;
    }
    this.isOnSegment = function(segment) {
      return this.isOnSegmentPoints(segment.a(), segment.b());
    }
    this.minus = function(point) {
      return new Point(
        (this.x - point.x),
        (this.y - point.y)
      );
    }
    this.add = function(origin) {
      return new Point(origin.x + this.x, origin.y + this.y);
    }
    this.cross = function(point) {
      return this.x * point.y - this.y * point.x;
    }
    this.logString = () => {
      return "("+parseInt(this.x)+","+parseInt(this.y)+")";
    }
  }
}