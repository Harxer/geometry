/**
 * Test file for Point.js
 */
import Point from "../structures/point";
import Segment from '../structures/segment';
import Vector from '../structures/vector';
import { minNumber, setGlobalEqualsPrecision } from "../geometry";

setGlobalEqualsPrecision(16);

describe('isOnSegment', function() {
  let testPointA = new Point(1, 1);
  let testPointB = new Point(6, 6);
  let testEndpointB = new Point(5, 5);
  let testSegment = new Segment({x: 0, y: 0}, testEndpointB);
  it('returns true for points on segment', function() {
    expect(testPointA.isOnSegment(testSegment)).toBe(true);
  })
  it('returns false for points off segment', function() {
    expect(testPointB.isOnSegment(testSegment)).toBe(false);
    expect(new Point(1, 0).isOnSegment(new Segment({x: 0.5, y: 0}, {x: 1, y: 0.5}))).toBe(false);
    expect(new Point(0.75, 0).isOnSegment(new Segment({x: 0.5, y: 0}, {x: 1, y: 0.5}))).toBe(false);
  })
  it('returns true for points on endpoint', function() {
    expect(testEndpointB.isOnSegment(testSegment)).toBe(true);
  })
  it('returns false for point slightly off endpoint', function() {
    expect(testEndpointB.copy.add(new Vector(0, minNumber(10))).isOnSegment(testSegment)).toBe(false);
    // Precision boundary
    expect(testEndpointB.copy.add(new Vector(0, minNumber())).isOnSegment(testSegment)).toBe(true);
  })
  it('returns true for point slightly on segment', function() {
    expect(testEndpointB.copy.add(new Vector(-0.0000000001, -0.0000000001)).isOnSegment(testSegment)).toBe(true);
  })
})
