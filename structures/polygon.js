import Point from './point.js'
import Segment from './segment.js'
import Vector from './vector.js'
import Ray from './ray.js'

export default class Polygon {
  constructor(vertices, holes) {
    this.vertices = [...vertices]

    // Calculate center
    let center = {x: 0, y: 0}
    vertices.forEach(vertex => center = {x: center.x + vertex.x, y: center.y + vertex.y})
    this.circumcenter = new Point(center.x / vertices.length, center.y / vertices.length);

    // Calculate circumcircle (smallest bound circle)
    let vertexDistanceSqrd = Math.pow(this.circumcenter.x - vertices[0].x, 2) + Math.pow(this.circumcenter.y - vertices[0].y, 2)
    for (let x = 1; x < vertices.length; x++) {
      let distSqrd = Math.pow(this.circumcenter.x - vertices[x].x, 2) + Math.pow(this.circumcenter.y - vertices[x].y, 2)
      if (distSqrd > vertexDistanceSqrd) vertexDistanceSqrd = distSqrd
    }
    this.circumradius = Math.sqrt(vertexDistanceSqrd)

    // Counterclockwise check
    let averageSlope = 0
    for (let i = 0; i < vertices.length; i++) {
      let v = vertices[i]
      let vNext = vertices[(i + 1) % vertices.length]
      averageSlope += (vNext.x - v.x) * (vNext.y + v.y)
    }
    this.counterclockwise = (averageSlope > 0)

    // Reference to hole polygons relative to this polygon
    this.holes = (holes === undefined) ? [] : holes
  }

  edges() {
    if (this._edges !== undefined) return this._edges
    let edges = []
    this.vertices.forEach((vertex, v) => {
      edges.push(new Segment(vertex, this.vertices[(v + 1) % this.vertices.length]))
    })
    edges.forEach(edge => edge.parent = this)
    this._edges = edges
    return this._edges
  }

  containsPoint(p) {
    if (this.vertices.length < 3) return false;

    let pInfinity = new Segment(p, new Point(p.x + 999999, p.y));
    let count = 0;
    // let firstEdgeOrientation = undefined

    for (let i = 0; i < this.vertices.length; i++) {
      let vPrev = this.vertices[(i - 1) < 0 ? this.vertices.length - 1 : i - 1]
      let v = this.vertices[i]
      let vNext = this.vertices[(i + 1) % this.vertices.length]

      let edge = new Segment(v, vNext)
      if (p.equals(edge.a()) || p.equals(edge.b())) return false

      if (orientation(edge.a(), p, edge.b()) == ORIENTATION.COLLINEAR) {
        if (p.isOnSegment(edge)) return false
      }

      if (edge.intersects(pInfinity)) {

        if (orientation(p, edge.a(), pInfinity.b()) == ORIENTATION.COLLINEAR) {
          if (edge.a().isOnSegment(pInfinity)) {
            if (orientation(v, p, vNext) !== orientation(vPrev, p, v)) continue
          }
        }
        if (orientation(p, edge.b(), pInfinity.b()) == ORIENTATION.COLLINEAR) {
          if (edge.b().isOnSegment(pInfinity)) continue
        }

        count += 1;
      }
    }

    if (count % 2 == 0 && this.counterclockwise) return true
    if (count % 2 == 1 && !this.counterclockwise) return true
    return false
  }

  contains(peer) {
    for (let v = 0; v < peer.vertices.length; v++) {
      if (!this.containsPoint(peer.vertices[v])) return false
    }
    return true
  }

  /**
   * Test if polygon is pierced by the given segment or ray. Will return a hash with various
   * data about the pierce location.
   */
  pierce(segment) {
    if (segment instanceof Ray) {
      segment = new Segment(segment.origin, new Point(999999 * Math.cos(segment.angle) + segment.origin.x, 999999 * Math.sin(segment.angle) + segment.origin.y))
    }
    let nearestIntersectingSide = {
      side: undefined,
      distanceSqrd: undefined,
      point: undefined
    };

    this.edges().forEach(edge => {
      let intersection = segment.intersectionPoint(edge);
      if (intersection) {
        let distSqrd = Math.pow(intersection.y - segment.a.y, 2) + Math.pow(intersection.x - segment.a.x, 2);
        // segmentsIntersect returning undefined indicates they don't intersect.
        if (!nearestIntersectingSide.side || distSqrd < nearestIntersectingSide.distanceSqrd) {
          nearestIntersectingSide.side = edge;
          nearestIntersectingSide.distanceSqrd = distSqrd;
          nearestIntersectingSide.point = intersection;
        }
      }
    });

    // Can return undefined or a segment object
    return nearestIntersectingSide;
  };

  overlaps(peer) {
    let distToPeer = Math.sqrt(Math.pow(peer.circumcenter.y - this.circumcenter.y, 2) + Math.pow(peer.circumcenter.x - this.circumcenter.x, 2))
    if (distToPeer >= this.circumradius + peer.circumradius) return false

    // Check edge overlaps
    for (let tV = 0; tV < this.vertices.length; tV++) {
      let thisSide = new Segment(this.vertices[tV], this.vertices[(tV+1)%this.vertices.length]);
      for (let pV = 0; pV < peer.vertices.length; pV++) {
        let peerSide = new Segment(peer.vertices[pV], peer.vertices[(pV+1)%peer.vertices.length]);

        let intersectionPoint = thisSide.intersectionPoint(peerSide);
        if (intersectionPoint === undefined) continue

        return true
      }
    }

    return false
  }

  /**
   * Joins two overlapping polygons together. Does not affect either polygons,
   * the new polygon union will be returned or undefined if they don't overlap.
   */
  union(peer) {
    let thisVertices = [...this.vertices]
    let peerVertices = [...peer.vertices]

    let outerNodes = []
    // Find outer vertices
    thisVertices.forEach(thisVertex => {
      if (!peer.containsPoint(thisVertex)) {
        for (let iOuterNode = 0; iOuterNode < outerNodes.length; iOuterNode++) {
          if (outerNodes[iOuterNode].vertex.equals(thisVertex)) {
            thisVertex.link = outerNodes[iOuterNode].vertex
            outerNodes[iOuterNode].vertex.link = thisVertex
            outerNodes.splice(iOuterNode, 1)
            return
          }
        }
        outerNodes.push({vertex: thisVertex, visited: false})
      }
    }) // Check if vertex is contained in peer
    peerVertices.forEach(peerVertex => {
      if (!this.containsPoint(peerVertex)) {
        for (let iOuterNode = 0; iOuterNode < outerNodes.length; iOuterNode++) {
          if (outerNodes[iOuterNode].vertex.equals(peerVertex)) {
            peerVertex.link = outerNodes[iOuterNode].vertex
            outerNodes[iOuterNode].vertex.link = peerVertex
            outerNodes.splice(iOuterNode, 1)
            return
          }
        }
        outerNodes.push({vertex: peerVertex, visited: false})
      }
    }) // Check if vertex is contained in this

    // Link intersection points
    let intersectionPointFound = false
    for (let tV = 0; tV < thisVertices.length; tV++) {
      let thisSide = new Segment(thisVertices[tV], thisVertices[(tV+1)%thisVertices.length]);
      for (let pV = 0; pV < peerVertices.length; pV++) {
        let peerSide = new Segment(peerVertices[pV], peerVertices[(pV+1)%peerVertices.length]);

        let intersectionPointThis = thisSide.intersectionPoint(peerSide);
        if (intersectionPointThis === undefined) continue
        let intersectionPointPeer = new Point(intersectionPointThis.x, intersectionPointThis.y)

        if (intersectionPointThis.equals(thisSide.a())) {
          intersectionPointThis = thisSide.a()
        } else if (intersectionPointThis.equals(thisSide.b())) {
          intersectionPointThis = thisSide.b()
        } else {
          thisVertices.splice(tV + 1, 0, intersectionPointThis)
        }

        if (intersectionPointPeer.equals(peerSide.a())) {
          intersectionPointPeer = peerSide.a()
        } else if (intersectionPointPeer.equals(peerSide.b())) {
          intersectionPointPeer = peerSide.b()
        } else {
          peerVertices.splice(pV + 1, 0, intersectionPointPeer)
        }

        intersectionPointThis.link = intersectionPointPeer
        intersectionPointPeer.link = intersectionPointThis

        intersectionPointFound = true
        tV -= 1
        break
      }
    }

    if (!intersectionPointFound) return undefined

    let newPolygons = []
    // Walk through outer vertices to form polygons
    for (let n = 0; n < outerNodes.length; n++) {
      let outerNode = outerNodes[n]
      if (outerNode.visited) continue

      let index = peerVertices.indexOf(outerNode.vertex)
      const START_VERTICES = (index == -1) ? thisVertices : peerVertices
      const START_VERTEX = (index == -1) ? thisVertices.indexOf(outerNode.vertex) : index

      let currentVertices = START_VERTICES
      let currentVertex = START_VERTEX
      let verticesBuilder = []
      let vertex = currentVertices[currentVertex]
      do {
        if (vertex.link !== undefined) {
          outerNodes.forEach(node => {if (node.vertex === vertex) node.visited = true})
          currentVertices = (currentVertices == peerVertices) ? thisVertices : peerVertices
          currentVertex = currentVertices.indexOf(vertex.link)
          vertex.link = undefined
          vertex = currentVertices[currentVertex]
          vertex.link = undefined
        }
        outerNodes.forEach(node => {if (node.vertex === vertex) node.visited = true})
        verticesBuilder.push(vertex)

        currentVertex = (currentVertex + 1) % currentVertices.length
        vertex = currentVertices[currentVertex]
      } while (START_VERTICES[START_VERTEX] !== currentVertices[currentVertex])

      newPolygons.push(new Polygon(verticesBuilder))
    }

    if (newPolygons.length == 0) return undefined
    let convexHullIndex = 0

    // Multiple polygons indicate a polygon with holes
    for (let t = 0; t < newPolygons.length; t++) {
      let thisPolygon = newPolygons[t]

      // Remove collinear vertices
      for (let i = 0; i < thisPolygon.vertices.length; i++) {
        let vPrev = thisPolygon.vertices[((i - 1) < 0) ? (thisPolygon.vertices.length - 1) : (i - 1)]
        let v = thisPolygon.vertices[i]
        let vNext = thisPolygon.vertices[(i + 1) % thisPolygon.vertices.length]

        if (orientation(vPrev, v, vNext) == ORIENTATION.COLLINEAR) {
          thisPolygon.vertices.splice(i, 1)
          i -= 1
        }
      }

      // Find convex hull polygon
      if (!thisPolygon.counterclockwise) convexHullIndex = t
    }

    let convexHullPolygon = newPolygons.splice(convexHullIndex, 1)[0]
    convexHullPolygon.holes = newPolygons.concat(this.holes).concat(peer.holes)

    return convexHullPolygon
  }

  // TODO: Fails edge cases.
  /**
   * Attempts to find the shortest line out of the polygon from a given point.
   * @param {Point} point Inside the polygon to leave from
   * @param {Number} extrude_amount Amount to buffer out the exit point
   * @returns
   */
  closestPointOutsideFrom(point, extrude_amount) {
    if (!this.containsPoint(point)) return point
    // Find closest point outside of polygon
    let closest = { distSqrd: undefined, point: undefined }
    this.edges().forEach(edge => {
      let closestPoint = edge.closestPointOnSegmentTo(point)
      let closestPointDistSqrd = new Segment(point, closestPoint).distanceSqrd()
      if (closest.distSqrd === undefined || closestPointDistSqrd < closest.distSqrd ) {
        closest.distSqrd = closestPointDistSqrd
        closest.point = closestPoint
      }
    });
    // Extend out result by 1 unit to avoid rounding errors
    return new Segment(point, closest.point).vector().extendBy(2).asPoint().add(point) // closest.point
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
    let a = (toPrev.angle() - toNext.angle() + Math.PI * 2) % (Math.PI * 2)
    return this.counterclockwise ? 2 * Math.PI - a : a
  }

  /** Check if the polygon is convex. */
  convex() {
    return !this.concave()
  }
  concave() {
    return this.vertices.some(v => this.interiorAngleVertex(v) > Math.PI)
  }

  logString() {
    let logStringBuilder = ''
    for (let v = 0; v < this.vertices.length; v++) {
      let vertex = this.vertices[v]
      logStringBuilder += ` ${vertex.logString()}`
    }
    // this.vertices.forEach(vertex => logStringBuilder += ` ${vertex.logString()}`)
    return logStringBuilder
  }
}
