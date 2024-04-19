/**
 * Test file for Geometry.js
 */
import * as Geometry from '../lib/geometry'
import Point from '../lib/structures/point'

Geometry.setGlobalEqualsPrecision(16);

describe('equals', function() {
  it('overcomes equality comparator', function() {
    expect(0.1 + 0.2 === 0.3).toBe(false);
    expect(Geometry.equals(0.1 + 0.2, 0.3)).toBe(true);
    expect(0.4 + 0.2 === 0.6).toBe(false);
    expect(Geometry.equals(0.4 + 0.2, 0.6)).toBe(true);
    expect(0.1 - 0.3 === -0.2).toBe(false);
    expect(Geometry.equals(0.1 - 0.3, -0.2)).toBe(true);
  })
  it('matches equality operator at floating point precision boundary', function() {
    // (1e-16)
    expect(10 + Geometry.minNumber()).toBe(10);
    expect(Geometry.equals(10 + Geometry.minNumber(), 10)).toBe(true);
    // (1e-15)
    expect(10 + Geometry.minNumber(10)).not.toBe(10);
    expect(Geometry.equals(1 + Geometry.minNumber(10), 1, 16)).not.toBe(true);
    // Reduced precision
    expect(Geometry.equals(1 + Geometry.minNumber(10), 1, 14)).toBe(true);
  })
  it('handles Infinity', function() {
    expect(Geometry.equals(Infinity, 100)).toBe(false);
    expect(Geometry.equals(-100, -Infinity)).toBe(false);
    expect(Geometry.equals(Infinity, Infinity)).toBe(true);
    expect(Geometry.equals(Infinity, -Infinity)).toBe(false);
    expect(Geometry.equals(-Infinity, -Infinity)).toBe(true);
  })
  it('handles coercion', function() {
    expect(Geometry.equals(undefined, 1)).toBe(false);
    expect(Geometry.equals(1, undefined)).toBe(false);
    expect(Geometry.equals(undefined, 0)).toBe(false);
    expect(Geometry.equals(0, undefined)).toBe(false);
    expect(Geometry.equals('', 1)).toBe(false);
    expect(Geometry.equals(1, '')).toBe(false);
    expect(Geometry.equals('', 0)).toBe(false);
    expect(Geometry.equals(0, '')).toBe(false);
    expect(Geometry.equals([], 1)).toBe(false);
    expect(Geometry.equals(1, [])).toBe(false);
    expect(Geometry.equals([], 0)).toBe(false);
    expect(Geometry.equals(0, [])).toBe(false);
    expect(Geometry.equals({}, 1)).toBe(false);
    expect(Geometry.equals(1, {})).toBe(false);
    expect(Geometry.equals({}, 0)).toBe(false);
    expect(Geometry.equals(0, {})).toBe(false);
    expect(Geometry.equals(true, 1)).toBe(false);
    expect(Geometry.equals(1, true)).toBe(false);
  })
})

describe('orientation', function() {
  it('handles colinear', function() {
    expect(Geometry.orientation(
      new Point(0, 1), new Point(0, 0.5), new Point(0, 2)
    )).toBe(Geometry.ORIENTATION.COLLINEAR);
    expect(Geometry.orientation(
      new Point(0, 2), new Point(0, -0.5), new Point(0, 1)
    )).toBe(Geometry.ORIENTATION.COLLINEAR);
    expect(Geometry.orientation(
      new Point(0, 1), new Point(0, 0), new Point(0, 1)
    )).toBe(Geometry.ORIENTATION.COLLINEAR);
    expect(Geometry.orientation(
      new Point(1, 0), new Point(-5, 0), new Point(2, 0)
    )).toBe(Geometry.ORIENTATION.COLLINEAR);
    expect(Geometry.orientation(
      {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}
    )).toBe(Geometry.ORIENTATION.COLLINEAR);
    expect(Geometry.orientation(
      {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}
    )).toBe(Geometry.ORIENTATION.COLLINEAR);
  });

  it('handles clockwise', function() {
    expect(Geometry.orientation(
      new Point(1, 0), new Point(0, 0), new Point(0, 1)
    )).toBe(Geometry.ORIENTATION.CCW);
    expect(Geometry.orientation(
      new Point(-5, -5), new Point(5, 5), new Point(0, Infinity)
    )).toBe(Geometry.ORIENTATION.CW);
    expect(Geometry.orientation(
      {x: 0, y: Infinity}, {x: 0, y: -Infinity}, {x: -5, y: -5}
    )).toBe(Geometry.ORIENTATION.CCW);
    expect(Geometry.orientation(
      {x: 0, y: Infinity}, {x: 0, y: -Infinity}, {x: 5, y: 5}
    )).toBe(Geometry.ORIENTATION.CW);
    expect(Geometry.orientation(
      new Point(0, 1), new Point(0, 0), new Point(1, 0)
    )).toBe(Geometry.ORIENTATION.CW);
  });
  it('handles infinity', function() {
    expect(Geometry.orientation(
      new Point(Infinity, 0), new Point(0, 0), new Point(0, Infinity)
    )).toBe(Geometry.ORIENTATION.CCW);
    expect(Geometry.orientation(
      new Point(0, Infinity), new Point(-Infinity, -Infinity), new Point(Infinity, 0)
    )).toBe(Geometry.ORIENTATION.CW);
  })
})

describe('boundAngle', function() {
  it('handles general cases', function() {
    expect(Geometry.equals(Geometry.boundAngle(Math.PI * 1 / 4), Math.PI * 1 / 4)).toBe(true);
    // boundAngle will lose precision as its taking a higher magnitude value and clamping it to a lower magnitude value.
    expect(Geometry.equals(Geometry.boundAngle(Math.PI * 1 / 4 + 8 * Math.PI), Math.PI * 1 / 4, 15)).toBe(true);
    expect(Geometry.equals(Geometry.boundAngle(Math.PI * 1 / 4 - 8 * Math.PI), Math.PI * 1 / 4, 15)).toBe(true);
    expect(Geometry.equals(Geometry.boundAngle(- Math.PI * 1 / 4), Math.PI * 7 / 4)).toBe(true);
  });
})

describe('magnitudeOrder', function() {
  it('handles standard formats', function() {
    expect(Geometry.magnitudeOrder(0)).toBe(1);
    expect(Geometry.magnitudeOrder(5)).toBe(1);
    expect(Geometry.magnitudeOrder(5.12515135)).toBe(1);
    expect(Geometry.magnitudeOrder(123456789)).toBe(9);
    expect(Geometry.magnitudeOrder(123456789.1234)).toBe(9);
  });
  it('handles non-standard formats', function() {
    expect(Geometry.magnitudeOrder(1e10)).toBe(11);
    expect(Geometry.magnitudeOrder(1e-16)).toBe(1);
    expect(Geometry.magnitudeOrder(Infinity)).toBe(Infinity);
  });
})

// describe('minNumber', function() {
//   it('handles standard formats', function() {
//     expect(Geometry.magnitudeOrder(0)).toBe(1);
//     expect(Geometry.magnitudeOrder(5)).toBe(1);
//     expect(Geometry.magnitudeOrder(5.12515135)).toBe(1);
//     expect(Geometry.magnitudeOrder(123456789)).toBe(9);
//     expect(Geometry.magnitudeOrder(123456789.1234)).toBe(9);
//   });
//   it('handles non-standard formats', function() {
//     expect(Geometry.magnitudeOrder(1e10)).toBe(11);
//     expect(Geometry.magnitudeOrder(1e-16)).toBe(1);
//     expect(Geometry.magnitudeOrder(Infinity)).toBe(Infinity);
//   });
// })
