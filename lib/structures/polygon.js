import Point from './point.js'
import Segment from './segment.js'
import Vector from './vector.js'
import { orientation, ORIENTATION, equals, validNumber, minNumber, boundAngle } from '../geometry.js'

export default class Polygon {
  /**
   * @param {[Point]} vertices Boundary vertices
   * @param {[Polygon]} holes Internal polygon holes
   */
  constructor(vertices, holes) {
    if (!Array.isArray(vertices)) throw Error(`[POLYGON INIT ERROR] vertices not array: ${vertices}`)
    if (vertices.length <= 2) throw Error(`[POLYGON INIT ERROR] 3 vertices required to make a polygon: ${vertices.length}`)

    this._vertices = [];
    for (let vertex of vertices) {
      if (typeof vertex === 'object') {
        if (!validNumber(vertex.x)) throw Error(`[POLYGON INIT ERROR]: X component not an integer: ${vertex.x}`);
        if (!validNumber(vertex.y)) throw Error(`[POLYGON INIT ERROR]: Y component not an integer: ${vertex.y}`);
        vertex = new Point(vertex.x, vertex.y);
      }
      this._vertices.push(vertex);
    }

    let excessVertices = [];
    // Verify if any vertices overlap/intersect
    for (let iEdgeA = 0; iEdgeA < this.edges.length - 1; iEdgeA++) {
      for (let iEdgeB = iEdgeA + 1; iEdgeB < this.edges.length; iEdgeB++) {

        if (iEdgeB === iEdgeA + 1) {
          // Immediate neighbors only get checked for the non-shared endpoint is collinear as `intersects()` would always result in true
          if (orientation(this.edges[iEdgeA].a, this.edges[iEdgeA].b, this.edges[iEdgeB].b) === ORIENTATION.COLLINEAR) {
            if (this.edges[iEdgeA].vector.quadrant() === this.edges[iEdgeB].vector.quadrant()) {
              // Repair collinear continued segments, remove excess vertices
              excessVertices.push(iEdgeA + 1);
            } else {
              // Verify no overlap, no backtracking
              throw Error(`[POLYGON INIT ERROR] edge neighbors collinear: ${this.edges[iEdgeA].logString()} with ${this.edges[iEdgeB].logString()}`);
            }
          }
          // TODO auto repair endpoint overlap
        } else if (iEdgeA === 0 && iEdgeB === this.edges.length - 1) {
          // First edge has to ignore endpoint overlap with closing edge
          if (orientation(this.edges[iEdgeB].a, this.edges[iEdgeB].b, this.edges[iEdgeA].b) == ORIENTATION.COLLINEAR) {
            throw Error(`[POLYGON INIT ERROR] closing edge collinear: ${this.edges[iEdgeA].logString()} with ${this.edges[iEdgeB].logString()}`);
          }
        } else if (this.edges[iEdgeA].intersects(this.edges[iEdgeB])) {
          throw Error(`[POLYGON INIT ERROR] edges intersect: ${this.edges[iEdgeA].logString()} with ${this.edges[iEdgeB].logString()}`);
        }
      }
    }
    if (excessVertices.length) {
      // TODO move this first populating this._vertices
      this._vertices = this._vertices.filter((_, i) => !excessVertices.includes(i));
      // regenerate edges after vertex manipulation
      this._edges = undefined;
      this.edges;
    }

    // Verify vertices are not collinear
    this.clockwise;

    // TODO - Test holes for overlap with boundary
    //

    // TODO - a polygon should not have parallel edges so close there is
    // no amount of gap between them. This is confusing for triangulation
    // and when finding nearest point outside of a polygon. It also conceptually
    // defeats the purpose of the polygon blocking out spaces. This case should
    // conjoin the two blockers into one or break apart a blocker into two.

    // Reference to hole polygons relative to this polygon
    this.holes = (holes === undefined) ? [] : holes
  }

  get vertices() {
    return this._vertices;
  }
  set vertices(_) { throw Error('Cannot modify vertices of a Polygon structure.') }

  /** Get vertices as connected segments @returns {[Segment]} */
  get edges() {
    if (this._edges === undefined) {
      let edges = []
      this.vertices.forEach((vertex, v) => {
        edges.push(new Segment(vertex, this.vertices[(v + 1) % this.vertices.length]))
      })
      edges.forEach(edge => edge.parent = this)
      this._edges = edges
    }
    return this._edges;
  }
  set edges(_) { throw Error('Cannot modify edges of Polygon structure.') }

  /** Get average center of all vertices */
  get circumcenter() {
    if (this._circumcenter === undefined) {
      let sumVertices = this.vertices.reduce(({x, y}, vertex) => {return {x: x + vertex.x, y: y + vertex.y}}, {x: 0, y: 0});
      this._circumcenter = new Point(sumVertices.x / this.vertices.length, sumVertices.y / this.vertices.length);
    }
    return this._circumcenter;
  }
  set circumcenter(_) { throw Error('Cannot modify circumcenter of Polygon structure.') }

  /** Get circumradius (smallest bounding circle) */
  get circumradius() {
    if (this._circumradius === undefined) {
      let furthestVertexSqrd = this.vertices.reduce((furthest, vertex) => Math.max(furthest, Segment.distanceSqrd(this.circumcenter, vertex)), 0);
      this._circumradius = Math.sqrt(furthestVertexSqrd);
    }
    return this._circumradius;
  }
  set circumradius(_) { throw Error('Cannot modify circumradius of Polygon structure.') }

  /** Get clockwise rule */
  get clockwise() {
    if (this._clockwise === undefined) {
      let averageSlope = this.edges.reduce((sum, edge) => sum + (edge.b.x - edge.a.x) * (edge.b.y + edge.a.y), 0);
      // for (let i = 0; i < this._vertices.length; i++) {
      //   let v = this._vertices[i]
      //   let vNext = this._vertices[(i + 1) % this._vertices.length]
      //   averageSlope += (vNext.x - v.x) * (vNext.y + v.y)
      // }
      if (equals(averageSlope, 0)) throw Error('[POLYGON INIT ERROR] vertices are colllinear')
      this._clockwise = (averageSlope > 0)
    }
    return this._clockwise;
  }
  set clockwise(_) { throw Error('Cannot modify clockwise state of Polygon structure.') }
  get counterclockwise() { return !this.clockwise; }
  set counterclockwise(_) { throw Error('Cannot modify counterclockwise state of Polygon structure.') }

  /** TODO: Optimize @returns {Polygon} */
  get copy() {
    return new Polygon(this.vertices);
  }

  // --------------------------

  // TODO - simplify alg: https://stackoverflow.com/questions/36399381/whats-the-fastest-way-of-checking-if-a-point-is-inside-a-polygon-in-python
  /** Check if given point is inside polygon - external to polygon if structure is clockwise.
   * @param {Point} p point to check
   * @returns {bool} true if point is internal or lies on structure's edge/vertex (for clockwise).
   */
  containsPoint(p) {
    let pInfiniteX = new Segment(p, {x: Infinity, y: p.y});
    let count = 0;
    for (let i = 0; i < this.edges.length; i++) {
      let edge = this.edges[i];
      // if (p.equals(edge.a) || p.equals(edge.b)) return false // TODO review change
      if (p.isOnSegment(edge)) return this.counterclockwise;
      if (edge.intersects(pInfiniteX)) {
        // Ensure not y-aligned with endpoint, only allow B, skip A
        if (!equals(p.y, Math.min(edge.a.y, edge.b.y)) || (equals(p.y, Math.max(edge.a.y, edge.b.y)) && !equals(edge.a.y, edge.b.y))) {
          count += 1
        }
      };
    }
    if (count % 2 == 1) return this.counterclockwise;
    return this.clockwise;
  }

  contains(peer) {
    for (let v = 0; v < peer.vertices.length; v++) {
      if (!this.containsPoint(peer.vertices[v])) return false
    }
    return true
  }

  /** Check if peer overlaps this structure. Edge shared structures are considered overlapping as
   * well as vertex overlapping structures.
   * @todo Structures within `minNumber()` should be considered overlapping.
   * @param {Polygon} peer
   * @returns {boolean}
   */
  overlaps(peer) {
    let distSqrdToPeer = Segment.distanceSqrd(this.circumcenter, peer.circumcenter);
    if (distSqrdToPeer >= Math.pow(this.circumradius + peer.circumradius, 2)) return false;

    return this.edges.some(edge => peer.edges.some(peerEdge => edge.intersects(peerEdge)));
  }

  /** Reverses the vertex order and, therefore, the clockwise state. */
  reverse() {
    this._vertices.reverse();
    this._vertices.splice(0, 0, this._vertices.pop())
    this._edges = undefined;
    this._clockwise = !this._clockwise;
    return this;
  }

  /**
   * Joins two overlapping polygons together. Does not affect either polygons,
   * the new polygon union will be returned or undefined if they don't overlap.
   */
  union(peer) {
    let self = this;

    const builder = {
      vertices: [],
      get lastVertex() {
        return this.vertices[this.vertices.length - 1];
      }
    }
    const tracer = {
      structure: undefined,
      iVertex: undefined,
      get iVertexNext() { return (this.iVertex + 1) % this.structure.vertices.length; },
      get vertex() { return this.structure.vertices[this.iVertex]; },
      get vertexNext() { return this.structure.vertices[this.iVertexNext]; },
      get structureOther() { return this.structure === self ? peer : self; },
      /** Flip structure from `peer` to `this`, or vice versa, and update iVertex with given index. */
      structureFlip(index) {
        this.structure = this.structureOther;
        this.iVertex = index;
      }
    }

    // Start tracer on first outer vertex by index
    tracer.iVertex = this.vertices.findIndex(vertex => !peer.containsPoint(vertex));
    if (tracer.iVertex === -1) {
      // `this` structure is fully contained by `peer`, find outer peer vertex
      tracer.iVertex = peer.vertices.findIndex(vertex => !this.containsPoint(vertex));
      tracer.structure = peer;
    } else {
      tracer.structure = this;
    }
    builder.vertices.push(tracer.vertex);

    // Begin tracing
    const startingVertex = builder.lastVertex;
    do {
      let edge = new Segment(builder.lastVertex, tracer.vertexNext);
      // Overlapping vertices can cause intersection point to be on top of the next vertex
      if (builder.lastVertex.equals(tracer.vertexNext)) {
        tracer.iVertex = tracer.iVertexNext;
        continue;
      }

      // Check for edge intersections on other structure
      let intersectionOtherIndices = tracer.structureOther.edges.reduce((found, otherEdge, iOtherEdge) => {
        if (otherEdge.intersects(edge)) found.push(iOtherEdge);
        return found;
      }, []);

      if (intersectionOtherIndices.length === 0) {
        // No intersections, continue to next vertex on current structure
        tracer.iVertex = tracer.iVertexNext;
        builder.vertices.push(tracer.vertex);
        continue;
      }

      // Get intersection point closest to current vertex
      let closestIntersection = intersectionOtherIndices.reduce((prev, iOtherEdge) => {
        let intersectionPoint = tracer.structureOther.edges[iOtherEdge].intersectionPoint(edge);
        if (intersectionPoint === undefined) { // Parallel lines
          intersectionPoint = tracer.structureOther.edges[iOtherEdge].b; // TODO assumes both CCW structures
        }
        if (intersectionPoint.equals(builder.lastVertex)) return prev;
        let distSqrd = Segment.distanceSqrd(intersectionPoint, builder.lastVertex);
        // TODO - verify we're not taking intersection points that are on the edge - or maybe we need those
        if (distSqrd < prev.distSqrd) return {distSqrd, point: intersectionPoint, index: iOtherEdge};
        return prev;
      }, {distSqrd: Infinity});

      if (closestIntersection.point === undefined) {
        // Intersection is collinear, continue to next vertex on current structure
        tracer.iVertex = tracer.iVertexNext;
        builder.vertices.push(tracer.vertex);
        continue;
      }

      builder.vertices.push(closestIntersection.point);
      tracer.structureFlip(closestIntersection.index);

      // Clean way to tell we've reached back to our starting position. Handles the
      // case where the final edge needs to be checked (tracer.nextVertex === startingVertex)
      // and case where intersection point flips to structure "A" last
      // edge (tracer.vertex === startingVertex). So let last vertex be pushed then pop.
    } while (builder.lastVertex !== startingVertex);
    builder.vertices.pop()

    return new Polygon(builder.vertices);
  }

  /**
   * Finds the shortest segment out of the polygon from a starting point.
   * @param {Point} point starting point
   * @param {Number} extrudeAmount optional. defaults to smallest amount possible
   * @returns {Point} shortest Point out of polygon, or the starting point if not within polygon
   */
  closestPointOutsideFrom(point, extrudeAmount = undefined) {
    if (!this.containsPoint(point)) return point;

    let closest = this.edges.reduce((smallest, edge, i) => {
      if (smallest.distSqrd === 0) return smallest;
      let closestOnSegment = edge.closestPointToPoint(point);
      let escapeSegment = new Segment(point, closestOnSegment);
      if (point.equals(closestOnSegment)) return {distSqrd: 0, escapeSegment, vIndex: i};
      let distSqrd = escapeSegment.distanceSqrd();
      return distSqrd < smallest.distSqrd ? {distSqrd, escapeSegment, vIndex: i} : smallest;
    }, {distSqrd: Infinity});

    if (extrudeAmount === undefined) {
      // The point should be extended out by the smallest amount possible that fails `containsPoint`.
      // minNumber() gives the smallest floating point precision we can add to a Number but this must
      // be offset by the magnitude of the input Point's components, as this cuts into the floating
      // point's decimal precision.
      extrudeAmount = minNumber(Math.max(Math.abs(point.x), Math.abs(point.y)));
    }
    // TODO - extrude could end up back inside polygon

    // On edge
    if (equals(closest.distSqrd, 0)) {
      let extendVector;
      // On endpoint A, extendBy outer angle of vertex
      if (this.edges[closest.vIndex].a.equals(closest.escapeSegment.b)) {
        let outerAngle = boundAngle(2 * Math.PI - this.interiorAngleVertex(closest.vIndex));
        let iPrev = closest.vIndex === 0 ? this.vertices.length - 1 : closest.vIndex - 1;
        // extendVector = new Vector({magnitude: 1, angle: boundAngle(this.edges[iPrev].angle - outerAngle / 2)});
        extendVector = new Vector({magnitude: 1, angle: boundAngle(this.edges[iPrev].vector.copy.flip().angle + outerAngle / 2)});
      }
      // On endpoint B, extendBy outer angle of vertex
      else if (this.edges[closest.vIndex].b.equals(closest.escapeSegment.b)) {
        let outerAngle = boundAngle(2 * Math.PI - this.interiorAngleVertex((closest.vIndex + 1) % this.vertices.length));
        extendVector = new Vector({magnitude: 1, angle: boundAngle(this.edges[closest.vIndex].vector.copy.flip().angle + outerAngle / 2)});
      }
      // On edge, extendBy edge normal
      else {
        extendVector = this.edges[closest.vIndex].vector.normal();
        if (this.clockwise) extendVector.flip();
      }
      extendVector.magnitude = extrudeAmount;
      return point.copy.add(extendVector);
    }
    return point.copy.add(closest.escapeSegment.vector.extendBy(extrudeAmount));
  }

  /**
   * Get the interior angle of the vertex within the polygon.
   *
   * @param Vertex vertex is a vertex object in the polygon's vertices array or an int
   * for the index number of the vertex to return the angle for.
   *
   * @returns the angle in radians of the edges meeting at the vector
   */
  interiorAngleVertex(vertex) {
    let v = (typeof vertex === 'number') ? vertex : this.vertices.indexOf(vertex)
    vertex = this.vertices[v]
    let vPrev = this.vertices[(v - 1) < 0 ? this.vertices.length - 1 : (v - 1)]
    let vNext = this.vertices[(v + 1) % this.vertices.length]
    let toPrev = new Vector(vPrev.x - vertex.x, vPrev.y - vertex.y)
    let toNext = new Vector(vNext.x - vertex.x, vNext.y - vertex.y)
    let dAngle = toPrev.angle - toNext.angle;
    return this.clockwise ? boundAngle(2 * Math.PI - dAngle) : boundAngle(dAngle);
  }

  /**
   * Extrude polygon vertices. An approximation of padding or "stroking" a polygon.
   * @returns {Polyon} with extruded vertices from target
   */
  extrudeVertices(extrudeAmount) {
    if (equals(extrudeAmount, 0)) return this.copy;
    let extrudedVertices = [];
    for (let v = 0; v < this.vertices.length; v++) {
      let cV = this.vertices[v];
      let nV = this.vertices[(v+1) % this.vertices.length];
      let pV = this.vertices[(v-1) < 0 ? (this.vertices.length+(v-1)) : (v-1)];
      // Vectors from current vertex out to previous and next vertex.
      let pVec = (new Vector(pV.x - cV.x, pV.y - cV.y)).normalize();
      let nVec = (new Vector(nV.x - cV.x, nV.y - cV.y)).normalize();
      let angle = Math.acos(pVec.dotProduct(nVec));
      let cross = pVec.crossProduct(nVec);
      if (cross <= 0) angle = 2*Math.PI - angle
      let angleBetween = pVec.angle + angle / 2;
      extrudedVertices.push(
        new Point(
          cV.x + extrudeAmount * Math.cos(angleBetween),
          cV.y + extrudeAmount * Math.sin(angleBetween)
        )
      );
    }
    return new Polygon(extrudedVertices);
  }

  /** Check if the polygon is convex. Memoized. @returns {bool} */
  convex() {
    return !this.concave()
  }

  /** Check if the polygon is concave. Memoized. @returns {bool} */
  concave() {
    if (this._concave === undefined) {
      this._concave = this.vertices.some(v => this.interiorAngleVertex(v) > Math.PI);
    }
    return this._concave;
  }

  logString() {
    return this.vertices.map(vertex => vertex.logString()).join(' ');
  }

  /** Gets plain JS object used for serialization. @returns {[Object]}*/
  json() {
    return this.vertices.map(vertex => vertex.json());
  }

  /** Compare vertices between structures @param {Polygon} peer @returns {boolean} */
  equals(peer) {
    return this.vertices.every((vertex, i) => vertex.equals(peer.vertices[i]));
  }
}
