/**
 * Test file for Vector.js
 */
import Vector from '../structures/vector';
import Point from '../structures/point';
import { equals, setGlobalEqualsPrecision } from '../geometry';

setGlobalEqualsPrecision(16);

describe('constructor', function() {
  it('populates x/y', function() {
    let x = Math.random() * 100, y = Math.random() * 100;
    let testVector = new Vector(x, y);
    expect(testVector.x).toBe(x);
    expect(testVector.y).toBe(y);
    expect(testVector._magnitude).toBe(undefined);
    expect(testVector._angle).toBe(undefined);
  })

  it('throws on invalid args', function() {
    let badX = 0 / 0, badY = {magnitude: 5, angle: 5};
    expect(_ => new Vector(badX, 1)).toThrow(`[VECTOR INIT ERROR]: X component not an integer: ${badX}`);
    expect(_ => new Vector(1, badY)).toThrow(`[VECTOR INIT ERROR]: Y component not an integer: ${badY}`);
  })

  it('populates magnitude/angle', function() {
    let magnitude = Math.random() * 100, angle = Math.random() * Math.PI * 2;
    let testVector = new Vector({magnitude, angle});
    expect(testVector._x).toBe(undefined);
    expect(testVector._y).toBe(undefined);
    expect(testVector.magnitude).toBe(magnitude);
    expect(testVector.angle).toBe(angle);
  })

  it('throws on bad magnitude/angle', function() {
    let badMagnitude = 0 / 0, badAngle = "5";
    expect(_ => new Vector({magnitude: badMagnitude, angle: 1})).toThrow(`[VECTOR INIT ERROR]: Magnitude not an integer: ${badMagnitude}`);
    expect(_ => new Vector({magnitude: 1, angle: badAngle})).toThrow(`[VECTOR INIT ERROR]: Angle not an integer: ${badAngle}`);
  })

  it('keeps magnitude positive, flips angle', function() {
    let magnitude = -5, angle = Math.PI / 2;
    let testVector = new Vector({magnitude, angle});
    // magnitude positive
    expect(testVector.magnitude).toBe(5);
    // angle rotated 180deg
    expect(testVector.angle).toBe(3 / 2 * Math.PI);
  })
});

describe('x', function() {
  it('computes x from magnitude/angle on get', function() {
    let magnitude = 5, angle = 0;
    let testVector = new Vector({magnitude, angle});
    expect(testVector._x).toBe(undefined);
    expect(testVector.x).toBe(5);
    expect(testVector._x).toBe(5);
    expect(testVector._y).toBe(undefined);
  })

  it('computes x and y from magnitude/angle on set', function() {
    let magnitude = 5, angle = 0;
    let testVector = new Vector({magnitude, angle});
    testVector.x = 11;
    expect(testVector._magnitude).toBe(undefined);
    expect(testVector._angle).toBe(undefined);
    expect(testVector._x).toBe(11);
    expect(testVector.x).toBe(11);
    expect(testVector._y).toBeCloseTo(0);
  })

  it('set preserves angle on zeroing x when y is zero', function() {
    let testVector = new Vector(5, 0);
    expect(testVector.magnitude).toBe(5);
    testVector.x = 0;
    expect(testVector.angle).toBe(0);
    expect(testVector.x).toBe(0);
    expect(testVector._x).toBe(undefined);
    expect(testVector.y).toBe(0);
    expect(testVector._y).toBe(undefined);
    expect(testVector.magnitude).toBe(0);
    testVector.magnitude = 5;
    expect(testVector.x).toBe(5);
    expect(testVector.y).toBe(0);
  })


  it('set handles zero vector', function() {
    let testVector = new Vector(5, 0);
    expect(testVector.magnitude).toBe(5);
    testVector.x = 0;
    expect(testVector.angle).toBe(0);
    expect(testVector.x).toBe(0);
    expect(testVector._x).toBe(undefined);
    expect(testVector.y).toBe(0);
    expect(testVector._y).toBe(undefined);
    expect(testVector.magnitude).toBe(0);
    testVector.magnitude = 5;
    expect(testVector.x).toBe(5);
    expect(testVector.y).toBe(0);
  })
  //todo throws
})

describe('y', function() {
  it('computes y from magnitude/angle on get', function() {
    let magnitude = 5, angle = Math.PI / 2;
    let testVector = new Vector({magnitude, angle});
    expect(testVector._y).toBe(undefined);
    expect(testVector.y).toBe(5);
    expect(testVector._y).toBe(5);
    expect(testVector._x).toBe(undefined);
  })

  it('computes y and x from magnitude/angle on set', function() {
    let magnitude = 5, angle = Math.PI / 2;
    let testVector = new Vector({magnitude, angle});
    testVector.y = 11;
    expect(testVector._magnitude).toBe(undefined);
    expect(testVector._angle).toBe(undefined);
    expect(testVector._y).toBe(11);
    expect(testVector.y).toBe(11);
    expect(testVector._x).toBeCloseTo(0);
  })

  it('set preserves angle on zeroing y when x is zero', function() {
    let testVector = new Vector(0, 5);
    expect(testVector.magnitude).toBe(5);
    testVector.y = 0;
    expect(testVector.angle).toBe(Math.PI / 2);
    expect(testVector.x).toBe(0);
    expect(testVector._x).toBe(undefined);
    expect(testVector.y).toBe(0);
    expect(testVector._y).toBe(undefined);
    expect(testVector.magnitude).toBe(0);
    testVector.magnitude = 5;
    expect(testVector.y).toBe(5);
    expect(testVector.x).toBeCloseTo(0);
  })
  //todo throws
})

describe('angle', function() {
  it('get computes angle from x/y', function() {
    let x = 0, y = 5;
    let testVector = new Vector(x, y);
    expect(testVector._angle).toBe(undefined);
    expect(testVector.angle).toBe(Math.PI / 2);
    expect(testVector._angle).toBe(Math.PI / 2);
    expect(testVector._magnitude).toBe(undefined);

    expect(equals(new Vector(10, 10).angle, Math.PI * 1 / 4)).toBe(true);
    expect(equals(new Vector(0, 10).angle, Math.PI / 2)).toBe(true);
    expect(equals(new Vector(10, -10).angle, Math.PI * 7 / 4)).toBe(true);
    expect(equals(new Vector(-10, 10).angle, Math.PI * 3 / 4)).toBe(true);
    expect(equals(new Vector(-10, -10).angle, Math.PI * 5 / 4)).toBe(true);
  })

  it('set computes angle and magnitude from x/y', function() {
    let x = 0, y = 5;
    let testVector = new Vector(x, y);
    testVector.angle = 0;
    expect(testVector._angle).toBe(0);
    expect(testVector.angle).toBe(0);
    expect(testVector._magnitude).toBeCloseTo(5);
    expect(testVector._x).toBe(undefined);
    expect(testVector._y).toBe(undefined);
  })

  it('get throws for zero vector', function() {
    let testVector = new Vector(0, 0);
    expect(_ => testVector.angle).toThrow('Cannot get angle of zero vector.');
  })
  //todo throws
})

describe('magnitude', function() {
  it('computes magnitude from x/y on get', function() {
    let x = 5, y = 0;
    let testVector = new Vector(x, y);
    expect(testVector._magnitude).toBe(undefined);
    expect(testVector.magnitude).toBe(5);
    expect(testVector._magnitude).toBe(5);
    expect(testVector._angle).toBe(undefined);
  })

  it('computes magnitude and angle from x/y on set', function() {
    let x = 5, y = 0;
    let testVector = new Vector(x, y);
    testVector.magnitude = 10;
    expect(testVector._magnitude).toBe(10);
    expect(testVector.magnitude).toBe(10);
    expect(testVector._angle).toBeCloseTo(0);
    expect(testVector._x).toBe(undefined);
    expect(testVector._y).toBe(undefined);
  })

  it('set clears components on zero magnitude', function() {
    let testVector = new Vector(5, 5);
    expect(testVector.magnitude).toBe(Math.sqrt(25 + 25));
    testVector.magnitude = 0;
    testVector.angle = Math.PI / 4;
    expect(testVector._x).toBe(undefined);
    expect(testVector.x).toBe(0);
    expect(testVector._y).toBe(undefined);
    expect(testVector.y).toBe(0);
  })

  it('forces positive magnitude and flipped angle from x/y on set', function() {
    let x = 5, y = 0;
    let testVector = new Vector(x, y);
    testVector.magnitude = -10;
    expect(testVector._magnitude).toBe(10);
    expect(testVector.magnitude).toBe(10);
    expect(testVector._angle).toBe(Math.PI);
    expect(testVector._x).toBe(undefined);
    expect(testVector._y).toBe(undefined);
  })
  //todo throws
})

describe('multiplyBy', function() {
  it('handles general', function() {
    let testVector = new Vector(5, 0);
    expect(testVector.angle).toBeCloseTo(0);
    expect(testVector.multiplyBy(2).magnitude).toBe(10);
    expect(testVector.angle).toBeCloseTo(0);
  })
})

describe('extendBy', function() {
  it('handles general', function() {
    let testVector = new Vector(5, 0);
    expect(testVector.angle).toBeCloseTo(0);
    expect(testVector.extendBy(1).magnitude).toBe(6);
    expect(testVector.angle).toBeCloseTo(0);
  });
})

describe('add', function() {
  it('modifies x axis', function() {
    let testVector = new Vector({magnitude: 0, angle: 0});
    testVector.add(new Vector({magnitude: 6, angle: 0}))
    expect(testVector.x).toBe(6);
    expect(testVector.y).toBeCloseTo(0);
  })
  it('modifies y axis', function() {
    let testVector = new Vector({magnitude: 0, angle: 0});
    testVector.add(new Vector({magnitude: 6, angle: Math.PI / 2}))
    expect(testVector.y).toBe(6);
    expect(testVector.x).toBeCloseTo(0);
  })
})

describe('minus', function() {
  it('modifies original', function() {
    let testVector = new Vector(5, 0);
    expect(testVector.minus(new Vector(1, 0)).x).toBe(4);
    expect(testVector.x).toBe(4);
  })
})

describe('slope', function() {
  it('returns y / x', function() {
    let testVector = new Vector(1, 5);
    expect(testVector.slope()).toBe(5);
  })
})

describe('flip', function() {
  it('modifies original', function() {
    let testVector = new Vector(1, 1);
    expect(testVector.flip().x).toBe(-1);
    expect(testVector.x).toBe(-1);
  })
})

describe('magnitudeSqrd', function() {
  it('does not compute nor memo magnitude', function() {
    let testVector = new Vector(2, 0);
    expect(testVector.magnitudeSqrd()).toBe(4);
    expect(testVector._magnitude).toBe(undefined);
  })
})

describe('normalize', function() {
  it('does not change angle', function() {
    let testVector = new Vector(-5, 0);
    expect(testVector.normalize().x).toBe(-1);
    expect(testVector.angle).toBeCloseTo(Math.PI);
    expect(testVector._magnitude).toBe(1);
  })
  it('modifies magnitude', function() {
    let testVector = new Vector({magnitude: 5, angle: Math.PI / 2});
    expect(testVector.normalize().x).toBeCloseTo(0);
    expect(testVector.y).toBe(1);
  })
})

describe('quadrant', function() {
  it('returns 4 sections', function() {
    expect((new Vector(1, 0)).quadrant()).toBe(1);
    expect((new Vector({magnitude: 1, angle: 0})).quadrant()).toBe(1);
    expect((new Vector(0, 1)).quadrant()).toBe(2);
    expect((new Vector({magnitude: 1, angle: Math.PI / 2})).quadrant()).toBe(2);
    expect((new Vector(-1, 0)).quadrant()).toBe(3);
    expect((new Vector({magnitude: 1, angle: Math.PI})).quadrant()).toBe(3);
    expect((new Vector(0, -1)).quadrant()).toBe(4);
    expect((new Vector({magnitude: 1, angle: Math.PI * 3 / 2})).quadrant()).toBe(4);
  })
})

describe('dotProduct', function() {
  it('is accurate', function() {
    let testVector = new Vector(5, 2);
    expect(testVector.dotProduct(new Vector(3, 4))).toBe(23);
  })
})

describe('crossProduct', function() {
  it('is accurate', function() {
    let testVector = new Vector(5, 2);
    expect(testVector.crossProduct(new Vector(3, 4))).toBe(14);
  })
})

describe('projection', function() {
  it('does not modify original', function() {
    let testVector = new Vector(5, 2);
    testVector.projection(new Vector(3, 4))
    expect(testVector.x).toBe(5);
    expect(testVector.y).toBe(2);
  })
  it('has same angle as peer', function() {
    let testVector = new Vector(5, 2);
    let peerVector = new Vector(3, 8);
    expect(testVector.angle).not.toBe(peerVector.angle);
    expect(testVector.projection(peerVector).angle).toBe(peerVector.angle);
  })
  it('handles mag/angle arrangement', function() {
    let testVector = new Vector({magnitude: 5, angle: Math.PI / 4});
    let peerVector = new Vector(3, 8);
    expect(testVector.angle).not.toBe(peerVector.angle);
    expect(testVector.projection(peerVector).angle).toBe(peerVector.angle);
  })
})

describe('equals', function() {
  it('compares x/y components', function() {
    let testVectorA = new Vector(5, 2);
    let testVectorB = new Vector(5, 2);
    expect(testVectorA.equals(testVectorB)).toBe(true);
    expect(testVectorA.equals(testVectorB.copy.flip())).toBe(false);
  })
  it('does not populate x/y if mag/angle arranged', function() {
    let testVectorA = new Vector({magnitude: 5, angle: 0});
    let testVectorB = new Vector({magnitude: -5, angle: Math.PI});
    expect(testVectorA.equals(testVectorB)).toBe(true);
    expect(testVectorA.equals(testVectorB.copy.flip())).toBe(false);
    expect(testVectorA._x).toBe(undefined);
    expect(testVectorA._y).toBe(undefined);
    expect(testVectorB._x).toBe(undefined);
    expect(testVectorB._y).toBe(undefined);
  })
})

describe('intersectsCircle', function() {
  it('handles intersection', function() {
    let testVectorA = new Vector(1, 1);
    expect(testVectorA.intersectsCircle(new Point(2, 2), 1.5)).toBe(true);
    expect(testVectorA.intersectsCircle(new Point(1, 1), 0.5)).toBe(true);
  })
  it('handles miss', function() {
    let testVectorA = new Vector(2, 2);
    expect(testVectorA.intersectsCircle(new Point(3, 3), 0.5)).toBe(false);
    expect(testVectorA.intersectsCircle(new Point(-2, -2), 1)).toBe(false);
  })
})

describe('logString', function() {
  it('formats', function() {
    let testVectorA = new Vector(1, 1);
    expect(testVectorA.logString()).toBe("(1, 1) D:undefined A:undefined");
  })
})
