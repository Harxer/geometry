/**
 * Test file for Segment.js
 */
import Segment from "../structures/segment";
import Point from "../structures/point";
import Vector from "../structures/vector";

describe('constructor', function() {
  it('has accepted arguments', function() {
    let testSegments = [
      // Point to Point
      new Segment(new Point(1, 1), new Point(2, 2)),
      // x/y to Point
      new Segment({x: 1, y: 1}, new Point(2, 2)),
      // Point to x/y
      new Segment(new Point(1, 1), {x: 2, y: 2}),
      // Point with Vector
      new Segment(new Point(1, 1), new Vector(1, 1)),
      // Point with magnitude/angle
      new Segment(new Point(1, 1), {magnitude: Math.sqrt(2), angle: Math.PI / 4})
    ];
    for (const testSegment of testSegments) {
      expect(testSegment.angle).toBeCloseTo(Math.PI / 4);
      expect(testSegment.magnitude).toBeCloseTo(Math.sqrt(2));
      expect(testSegment.b.x).toBeCloseTo(2);
      expect(testSegment.b.y).toBeCloseTo(2);
    }
  })
})

describe('a', function() {
  it('clears _vector on set', function() {
    let testSegment = new Segment(new Point(1, 1), new Vector(1, 1));
    expect(testSegment._vector).not.toBe(undefined);
    testSegment.a = new Point(0, 0)
    expect(testSegment._vector).toBe(undefined);
  })
})

describe('b', function() {
  it('clears _vector on set', function() {
    let testSegment = new Segment(new Point(1, 1), new Vector(1, 1));
    expect(testSegment._vector).not.toBe(undefined);
    testSegment.b = new Point(3, 3)
    expect(testSegment._vector).toBe(undefined);
  })
  it('populates _b on get', function() {
    let testSegment = new Segment(new Point(1, 1), new Vector(0, 3));
    expect(testSegment._b).toBe(undefined);
    expect(testSegment.b.equals({x: 1, y: 4})).toBe(true);
    expect(testSegment._b).not.toBe(undefined);
  })
})

describe('magnitude', function() {
  it('populates _vector on get', function() {
    let testSegment = new Segment(new Point(1, 1), new Point(4, 1));
    expect(testSegment._vector).toBe(undefined);
    expect(testSegment.magnitude).toBe(3)
    expect(testSegment._vector).not.toBe(undefined);
  })
})

describe('directionTo', function() {
  it('returns correct signs or 0', function() {
    let testSegment = new Segment({x: 0, y: 0}, {x: 5, y: 0});
    expect(testSegment.directionTo(new Point(5,  5))).toBe(1);
    expect(testSegment.directionTo(new Point(5, -5))).toBe(-1);
    expect(testSegment.directionTo(new Point(5,  0))).toBe(0);
  })
})

describe('intersects', function() {
  let endpointA = new Point(-5, -5);
  let endpointB = new Point(5, 5);
  let testSegmentA = new Segment(endpointA, endpointB);
  it('handles general cases', function() {
    expect(testSegmentA.intersects(new Segment({x: 5, y: -5}, {x: -5, y: 5}))).toBe(true);
    expect(testSegmentA.intersects(new Segment(endpointA.copy.add({x: 1, y: 0}), endpointB.copy.add({x: 1, y: 0})))).toBe(false);
  })
  it('handles shared endpoints', function() {
    expect(testSegmentA.intersects(testSegmentA)).toBe(true);
    expect(testSegmentA.intersects(testSegmentA.copy.flip())).toBe(true);
    expect(testSegmentA.intersects(new Segment(endpointA, {x: -15, y: -15}))).toBe(true);
    expect(testSegmentA.intersects(new Segment(endpointA, {x: Infinity, y: -15}))).toBe(true);
    expect(testSegmentA.intersects(new Segment(endpointA, {x: 5, y: 5}))).toBe(true);
    expect(testSegmentA.intersects(new Segment(endpointA, {x: 0, y: 1}))).toBe(true);
    expect(testSegmentA.intersects(new Segment({x: -15, y: -15}, endpointB))).toBe(true);
    expect(testSegmentA.intersects(new Segment({x: Infinity, y: -15}, endpointB))).toBe(true);
    expect(testSegmentA.intersects(new Segment({x: 5, y: 5}, endpointB))).toBe(true);
    expect(testSegmentA.intersects(new Segment({x: 0, y: 1}, endpointB))).toBe(true);
  })
  // it('returns true for endpoints starting on peer segment', function() {

  // })
  it('handles colinear', function() {
    expect(testSegmentA.intersects(new Segment(endpointB.copy.add({x: 1, y: 1}), endpointB.copy.add({x: 2, y: 2})))).toBe(false);
    // TODO - fails:
    // expect(testSegmentA.intersects(new Segment({x: -Infinity, y: -Infinity}, {x: Infinity, y: Infinity}))).toBe(true);
  })
  it('handles Infinity', function() {
    expect(testSegmentA.intersects(new Segment({x: 0, y: Infinity}, {x: 0, y: -Infinity}))).toBe(true);
    expect(testSegmentA.intersects(new Segment({x: Infinity, y: 0}, {x: -Infinity, y: 0}))).toBe(true);
  })
})

describe('intersectionPoint', function() {
  let endpointA = new Point(-5, -5);
  let endpointB = new Point(5, 5);
  let testSegmentA = new Segment(endpointA, endpointB);
  let testSegmentParallelA = new Segment(testSegmentA.a.copy.add({x: 1, y: 0}), testSegmentA.b.copy.add({x: 1, y: 0}));
  let testSegmentColinearA = new Segment(new Point(-4, -4), new Point(4, 4));
  let testSegmentSharedEnd1A = new Segment(endpointA, new Point(5, -5));
  let testSegmentSharedEnd2A = new Segment(new Point(-5, 5), endpointB);
  let testSegmentEdgeA = new Segment(testSegmentA.midpoint(), new Point(5, -5));
  let testSegmentB = new Segment(new Point(-5, 5), new Point(5, -5));
  let testSegmentMiss = new Segment(new Point(100, 20), new Point(102, 23));
  it('handles intersection', function() {
    expect(testSegmentA.intersectionPoint(testSegmentB).equals(new Point(0, 0))).toBe(true);
  })
  it('handles no intersection', function() {
    expect(testSegmentA.intersectionPoint(testSegmentMiss)).toBe(undefined);
  })
  it('handles parallel', function() {
    expect(testSegmentA.intersectionPoint(testSegmentParallelA)).toBe(undefined);
  })
  it('handles colinear', function() {
    expect(testSegmentA.intersectionPoint(testSegmentColinearA)).toBe(undefined);
  })
  it('handles endpoints', function() {
    expect(endpointA.equals(testSegmentA.intersectionPoint(testSegmentSharedEnd1A))).toBe(true);
    expect(endpointB.equals(testSegmentA.intersectionPoint(testSegmentSharedEnd2A))).toBe(true);
  })
  it('handles on edge', function() {
    expect(testSegmentA.midpoint().equals(testSegmentA.intersectionPoint(testSegmentEdgeA))).toBe(true);
  })
})

describe('equals', function() {
  let endpointA = new Point(-5, -5);
  let endpointB = new Point(5, 5);
  let endpointC = new Point(5, 25);
  let testSegmentA = new Segment(endpointA, endpointB);
  let testSegmentASame = new Segment(endpointA, endpointB);
  let testSegmentB = new Segment(endpointA, endpointC);
  it('handles equality', function() {
    expect(testSegmentA.equals(testSegmentA)).toBe(true);
    expect(testSegmentA.equals(testSegmentASame)).toBe(true);
  })
  it('handles inequality', function() {
    expect(testSegmentA.equals(testSegmentB)).toBe(false);
  })
})


