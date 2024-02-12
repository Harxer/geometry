/**
 * Test file for Polygon.js
 */
import Polygon from "../structures/polygon";
import Point from "../structures/point";
import Vector from "../structures/vector";
import Segment from "../structures/segment";
import { equals, minNumber, magnitudeOrder, setGlobalEqualsPrecision, globalEqualsPrecision } from '../geometry';

setGlobalEqualsPrecision(16);

describe('constructor', function() {
  it('throws on intersecting edges', function() {
    expect(_ => new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0.75, y: 1},
      {x: 0.75, y: 0.75},
      {x: 1.25, y: 0.75},
      {x: 1.25, y: 0.5},
      {x: 0, y: 0.5}
    ])).toThrow('[POLYGON INIT ERROR] edges intersect: (1, 0) -> (1, 1) with (0.75, 0.75) -> (1.25, 0.75)');
  })
  it('throws on collinear neighbors', function() {
    expect(_ => new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 1, y: 0.5},
      new Point(0, 0.5)
    ])).toThrow('[POLYGON INIT ERROR] edge neighbors collinear: (1, 0) -> (1, 1) with (1, 1) -> (1, 0.5)');
  })
  it('cleans up collinear non-overlapping neighbors', function() {
    let nonOverlappingCollinearVertices = [
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 2, y: 0},
      {x: 2, y: 1},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ];
    expect(_ => new Polygon(nonOverlappingCollinearVertices)).not.toThrow();
    expect((new Polygon(nonOverlappingCollinearVertices)).equals(new Polygon([
      {x: 0, y: 0},
      {x: 2, y: 0},
      {x: 2, y: 1},
      {x: 0, y: 1}
    ]))).toBe(true);
  })
})

describe('clockwise', function() {
  it('matches', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.clockwise).toBe(false);
    expect(testPolygon.counterclockwise).toBe(true);
  })
  it('matches counter', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      new Point(0, 1),
      {x: 1, y: 1},
      {x: 1, y: 0}
    ]);
    expect(testPolygon.clockwise).toBe(true);
  })
})

describe('circumcenter', function() {
  it('is in center', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.circumcenter.equals({x: 0.5, y: 0.5})).toBe(true);
  })
})

describe('circumradius', function() {
  it('is radius', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.circumradius).toBe(Math.sqrt(0.5 ** 2 * 2));
  })
})

describe('convex', function() {
  it('handles convex shape', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.convex()).toBe(true);
  })
  it('handles concave shape', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 0.25},
      {x: 0.5, y: 0.25},
      {x: 0.5, y: 0.75},
      {x: 1, y: 0.75},
      {x: 0.75, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.convex()).toBe(false);
  })
})

describe('interiorAngleVertex', function() {
  it('is accurate', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 1, y: 0.5},
      {x: 0.5, y: 1},
      {x: 0, y: 0.5}
    ]);
    expect(testPolygon.interiorAngleVertex(0)).toBe(Math.PI / 2);
    expect(testPolygon.interiorAngleVertex(1)).toBe(Math.PI / 2);
    expect(testPolygon.interiorAngleVertex(2)).toBe(Math.PI / 2);
    expect(testPolygon.interiorAngleVertex(3)).toBe(Math.PI / 2);
  })
})

describe('containsPoint', function() {
  it('handles counterclockwise', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 1, y: 0.5},
      {x: 0.5, y: 1},
      {x: 0, y: 0.5}
    ]);
    expect(testPolygon.counterclockwise).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5, 0))).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5 + minNumber(), 0))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5 - minNumber(), 0))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5, 0 + minNumber(10)))).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5, 0 - minNumber()))).toBe(false);
  })
  it('handles corner', function() {
    let corner2 = new Point(1, 0.5);
    let testPolygon = new Polygon([
      {x: 0, y: 0},
      corner2,
      {x: 0, y: 1},
      {x: -1, y: 0.5}
    ]);
    expect(testPolygon.containsPoint(corner2)).toBe(true);
  })
  it('handles Infinity', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 1, y: 0.5},
      {x: 0.5, y: 1},
      {x: 0, y: 0.5}
    ]);
    expect(testPolygon.clockwise).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5, 0))).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5 + Infinity, 0))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5 - Infinity, 0))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5, 0 + Infinity))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5, 0 - Infinity))).toBe(false);
  })
  it('handles clockwise', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 0, y: 0.5},
      {x: 0.5, y: 1},
      {x: 1, y: 0.5}
    ]);
    expect(testPolygon.clockwise).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5, 0))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5 - minNumber(100), 0))).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5 + minNumber(1000), 0))).toBe(true);
    expect(testPolygon.containsPoint(new Point(0.5, 0 + minNumber(100)))).toBe(false);
    expect(testPolygon.containsPoint(new Point(0.5, 0 - minNumber(1000)))).toBe(true);
  })
})

describe('closestPointOutsideFrom', function() {
  it('extrudes for small integer polygons', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 1, y: 0.5},
      {x: 0.5, y: 1},
      {x: 0, y: 0.5}
    ]);
    let internalPoint = new Point(0.6, 0.6);
    let escapePoint = testPolygon.closestPointOutsideFrom(internalPoint);
    // Project escape point back onto known, exited segment
    let borderPoint = testPolygon.vertices[1].copy.add((new Segment(testPolygon.vertices[1], escapePoint)).vector.projection(testPolygon.edges[1].vector));

    expect(testPolygon.containsPoint(internalPoint)).toBe(true);
    expect(testPolygon.containsPoint(escapePoint)).toBe(false);
    expect(testPolygon.containsPoint(borderPoint)).toBe(true);
    expect(borderPoint.equals(new Point(0.75, 0.75))).toBe(true);

    // Ensure small buffer relative to polygon vertex floating point magnitude
    let escapeBuffer = Segment.distance(borderPoint, escapePoint);
    expect(equals(escapeBuffer, minNumber())).toBe(true);
  });

  it('extrudes for large integer polygons', function() {
    const MAGNITUDE_SHIFT = 1e6;
    let testPolygon = new Polygon([
      new Point(0.5, 0).add(new Vector(MAGNITUDE_SHIFT, 0)),
      new Point(1, 0.5).add(new Vector(MAGNITUDE_SHIFT, 0)),
      new Point(0.5, 1).add(new Vector(MAGNITUDE_SHIFT, 0)),
      new Point(0, 0.5).add(new Vector(MAGNITUDE_SHIFT, 0))
    ]);
    let internalPoint = new Point(0.6, 0.6).add(new Vector(MAGNITUDE_SHIFT, 0));
    let escapePoint = testPolygon.closestPointOutsideFrom(internalPoint);
    // Project escape point back onto known, exited segment
    let borderPoint = testPolygon.vertices[1].copy.add((new Segment(testPolygon.vertices[1], escapePoint)).vector.projection(testPolygon.edges[1].vector));

    expect(testPolygon.containsPoint(internalPoint)).toBe(true);
    expect(testPolygon.containsPoint(escapePoint)).toBe(false);
    expect(testPolygon.containsPoint(borderPoint)).toBe(true);

    // precision must be reduced to magnitude 10 (since 16 (max) minus 6 (MAGNITUDE_SHIFT))
    const precision = 16 - magnitudeOrder(MAGNITUDE_SHIFT) - 1; // max precision magnitude minus magnitude shift
    expect(borderPoint.equals(new Point(0.75, 0.75).add(new Vector(MAGNITUDE_SHIFT, 0)), precision)).toBe(true);

    // Ensure small buffer relative to polygon vertex floating point magnitude
    let escapeBuffer = Segment.distance(borderPoint, escapePoint);
    expect(equals(escapeBuffer, minNumber(MAGNITUDE_SHIFT), precision)).toBe(true);
  });

  it('extrudes from vertex', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 1, y: 0.5},
      {x: 0.5, y: 1},
      {x: 0, y: 0.5}
    ]);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.5, 1)).equals(new Point(0.5, 1 + minNumber()))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(1, 0.5)).equals(new Point(1 + minNumber(), 0.5))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.5, 0)).equals(new Point(0.5, 0 - minNumber()))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0, 0.5)).equals(new Point(-minNumber(), 0.5))
    ).toBe(true);
  })

  it('extrudes from edge', function() {
    let testPolygon = new Polygon([
      {x: 0.5, y: 0},
      {x: 1, y: 0.5},
      {x: 0.5, y: 1},
      {x: 0, y: 0.5}
    ]);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.5, 0.5)).equals(new Point(0.75 + minNumber(), 0.25 - minNumber()))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.75, 0.25)).equals(new Point(0.75 + minNumber(), 0.25 - minNumber()))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.75, 0.75)).equals(new Point(0.75 + minNumber(), 0.75 + minNumber()))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.25, 0.75)).equals(new Point(0.25 - minNumber(), 0.75 + minNumber()))
    ).toBe(true);
    expect(
      testPolygon.closestPointOutsideFrom(new Point(0.25, 0.25)).equals(new Point(0.25 - minNumber(), 0.25 - minNumber()))
    ).toBe(true);
  })
})

describe('overlaps', function() {
  it('handles overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 0.5, y: 0.5},
      {x: 1.5, y: 0.5},
      {x: 1.5, y: 1.5},
      {x: 0.5, y: 1.5}
    ]);
    expect(testPolygonA.overlaps(testPolygonB)).toBe(true);
  })
  it('handles no overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1.5, y: 0.5},
      {x: 2.5, y: 0.5},
      {x: 2.5, y: 1.5},
      {x: 1.5, y: 1.5}
    ]);
    expect(testPolygonA.overlaps(testPolygonB)).toBe(false);
  })
  it('handles edge sharing', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1, y: 0.5},
      {x: 2, y: 0.5},
      {x: 2, y: 1.5},
      {x: 1, y: 1.5}
    ]);
    expect(testPolygonA.overlaps(testPolygonB)).toBe(true);
  })
  // TODO
  // it('handles minimum gap', function() {
  //   let testPolygonA = new Polygon([
  //     {x: 0, y: 0},
  //     {x: 1, y: 0},
  //     {x: 1, y: 1},
  //     {x: 0, y: 1}
  //   ]);
  //   let testPolygonB = new Polygon([
  //     {x: 1 + minNumber(), y: 0.5},
  //     {x: 2, y: 0.5},
  //     {x: 2, y: 1.5},
  //     {x: 1 + minNumber(), y: 1.5}
  //   ]);
  //   expect(testPolygonA.overlaps(testPolygonB)).toBe(true);
  // })
  it('handles vertex point sharing', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1, y: 1},
      {x: 2, y: 1},
      {x: 2, y: 2},
      {x: 1, y: 2}
    ]);
    expect(testPolygonA.overlaps(testPolygonB)).toBe(true);
  })
})

describe('union', function() {
  it('handles overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 0.5, y: 0.5},
      {x: 1.5, y: 0.5},
      {x: 1.5, y: 1.5},
      {x: 0.5, y: 1.5}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 0.5},
      {x: 1.5, y: 0.5},
      {x: 1.5, y: 1.5},
      {x: 0.5, y: 1.5},
      {x: 0.5, y: 1},
      {x: 0, y: 1}
    ]))).toBe(true);
  });
  // Special situation where final edge overlaps but shouldn't be added to builder vertices
  it('handles final edge overlap', function() {
    let testPolygonA = new Polygon([
      {x: 1954, y: 864},
      {x: 1642, y: 860},
      {x: 1796, y: 488},
    ]);
    let testPolygonB = new Polygon([
      {x: 1714, y: 984},
      {x: 1792, y: 724},
      {x: 1900, y: 978},
    ]);
    expect(testPolygonA.union(testPolygonB).equals(new Polygon([
      {x: 1954, y: 864},

      // Intersection
      {x: 1850.9658952496954, y: 862.6790499390986},

      {x: 1900, y: 978},
      {x: 1714, y: 984},

      // Intersection
      {x: 1750.7816091954023, y: 861.3946360153257},

      {x: 1642, y: 860},
      {x: 1796, y: 488},
    ]))).toBe(true);
  });
  it('handles edge overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1, y: 0},
      {x: 2, y: 0},
      {x: 2, y: 1},
      {x: 1, y: 1}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 2, y: 0},
      {x: 2, y: 1},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]))).toBe(true);
  });
  it('handles no overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1.5, y: 0.5},
      {x: 2.5, y: 0.5},
      {x: 2.5, y: 1.5},
      {x: 1.5, y: 1.5}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(testPolygonA)).toBe(true);
  });
  it('handles edge shifted right overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1, y: -0.5},
      {x: 2, y: -0.5},
      {x: 2, y: 0.5},
      {x: 1, y: 0.5}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: -0.5},
      {x: 2, y: -0.5},
      {x: 2, y: 0.5},
      {x: 1, y: 0.5},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]))).toBe(true);
  });
  it('handles edge shifted left overlap', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 1, y: 0.5},
      {x: 2, y: 0.5},
      {x: 2, y: 1.5},
      {x: 1, y: 1.5}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 0.5},
      {x: 2, y: 0.5},
      {x: 2, y: 1.5},
      {x: 1, y: 1.5},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]))).toBe(true);
  });
  it('handles edge internal', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 0.5, y: 0.25},
      {x: 1, y: 0.25},
      {x: 1, y: 0.75},
      {x: 0.5, y: 0.75}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(testPolygonA)).toBe(true);
  });
  it('handles internal', function() {
    let testPolygonA = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    let testPolygonB = new Polygon([
      {x: 0.5, y: 0.25},
      {x: 0.75, y: 0.25},
      {x: 0.75, y: 0.75},
      {x: 0.5, y: 0.75}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(testPolygonA)).toBe(true);
  });
  it('handles edge internal reverse', function() {
    let testPolygonA = new Polygon([
      {x: 0.5, y: 0.25},
      {x: 1, y: 0.25},
      {x: 1, y: 0.75},
      {x: 0.5, y: 0.75}
    ]);
    let testPolygonB = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(testPolygonB)).toBe(true);
  });
  it('handles internal reverse', function() {
    let testPolygonA = new Polygon([
      {x: 0.5, y: 0.25},
      {x: 0.75, y: 0.25},
      {x: 0.75, y: 0.75},
      {x: 0.5, y: 0.75}
    ]);
    let testPolygonB = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 1, y: 1},
      {x: 0, y: 1}
    ]);
    expect(testPolygonA.union(testPolygonB).equals(testPolygonB)).toBe(true);
  });
})

describe('extrudeVertices', function() {
  it('general cases', function() {
    let holdPreviousGlobalPrecision = globalEqualsPrecision;
    // Need to reduce precision by a magnitude here since we loose a magnitude when the
    // angle wraps past 360deg (vertex 3 in polygon below).
    // This makes inv cos() and inv sin() slightly less precise.
    setGlobalEqualsPrecision(holdPreviousGlobalPrecision - 1);

    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    let extrudeAmount = 1;
    expect(testPolygon.extrudeVertices(extrudeAmount).equals(new Polygon([
      new Point(0,0).add(new Vector({magnitude: extrudeAmount, angle: Math.PI * 5 / 4})),
      new Point(1,0).add(new Vector({magnitude: extrudeAmount, angle: Math.PI * 7 / 4})),
      new Point(1,1).add(new Vector({magnitude: extrudeAmount, angle: Math.PI * 1 / 4})),
      new Point(0,1).add(new Vector({magnitude: extrudeAmount, angle: Math.PI * 3 / 4}))
    ]))).toBe(true);

    setGlobalEqualsPrecision(holdPreviousGlobalPrecision); // Revert precision override
  })
  it('handles zero extrusion', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.extrudeVertices(0).equals(testPolygon)).toBe(true);
  })
})

describe('reverse', function() {
  it('maintains start point', function() {
    let testPolygon = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 0.5, y: 1},
    ]);
    expect(testPolygon.copy.reverse().equals(new Polygon([
      {x: 0, y: 0},
      {x: 0.5, y: 1},
      {x: 1, y: 0},
    ]))).toBe(true);
  })
  it('is idempotent', function() {
    let testPolygon = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 0.5, y: 1},
    ]);
    expect(testPolygon.copy.reverse().reverse().equals(testPolygon)).toBe(true);
  })
  it('flips clockwise state', function() {
    let testPolygon = new Polygon([
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x: 0.5, y: 1},
    ]);
    expect(testPolygon.clockwise).toBe(testPolygon.copy.reverse().counterclockwise);
  })
})

describe('logString', function() {
  it('formats', function() {
    let testPolygon = new Polygon([
      new Point(0, 0),
      {x: 1, y: 0},
      {x: 1, y: 1},
      new Point(0, 1)
    ]);
    expect(testPolygon.logString()).toBe("(0, 0) (1, 0) (1, 1) (0, 1)");
  })
})