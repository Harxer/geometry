/**
 * A segment that extends infinitely in one direction - or a vector with infinite magnitude.
 *
 * @param Point origin The starting point of the ray. Origin will default to (0, 0) if omitted.
 * @param Number direction The angle, in degrees, in which the ray extends. This value can
 * also be passed in as a Vector which will use the vector's angle as the direction.
 */
 export default class Ray {
  constructor(origin, direction) {
    if (origin.constructor.name == "Point") {
      this.origin = origin
      if (Number.isInteger(direction)) this.angle = Math.PI / 180 * direction
      else
      if (direction.constructor.name == "Vector") this.angle = direction.angle()
    }
    else if (direction === undefined) {
      this.origin = new Point(0, 0)
      if (Number.isInteger(origin)) this.angle = Math.PI / 180 * origin
      else
      if (origin.constructor.name == "Vector") this.angle = origin.angle()
      else
      throw "Invalid ray construction parameters."
    }
  }

  logString() {
    return `From ${this.origin.logString()} towards ${this.angle}`
  }
}