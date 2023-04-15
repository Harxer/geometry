/// Unlike a segment, a line does not end at its a and b points - it passes through them.
/// This is primarily used for line intersection checks (versus bounded segment checks).
/// Create a line from a segment using the line() function on a segment object.
export default class Line {
  constructor(point1, point2) {
    this.a = point1;
    this.b = point2;
  }

  /// Checks if the target line intersects the argument line.
  intersects(line) {
    let y1 = this.b.y - this.a.y;
    let x1 = this.b.x - this.a.x;
    let y2 = line.b.y - line.a.y;
    let x2 = line.b.x - line.a.x;

    let det = y1 * x2 - y2 * x1;
    if (det == 0) {
      return false;
    } else {
      return true;
    }
  }

  /// Checks if the target line intersects the argument line and returns
  /// the intersection point or undefined if there is no intersection.
  intersectionPoint(line) {
    let y1 = this.b.y - this.a.y; // A1
    let x1 = this.b.x - this.a.x; // B1
    let y2 = line.b.y - line.a.y; // A2
    let x2 = line.b.x - line.a.x; // B2

    let det = y1 * x2 - y2 * x1;
    if (det == 0) {
      return undefined;
    } else {
      let c1 = y1*this.a.x + x1*this.a.y;
      let c2 = y2*line.a.x + x2*line.a.y;
      let x = (x2 * c1 - x1 * c2) / det;
      let y = (y1 * c2 - y2 * c1) / det;
      return new Point(x, y);
    }
  }
}