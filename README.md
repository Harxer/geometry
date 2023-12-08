# HX Geometry


Do we force "grammatical" correctness? As in, only use a "Point" when you want
to represent a singular location in space. Or can a Vector represent a Point.

How is it used in projects?



Why doesn't Vector inherit from Point?

Optimizations to Vector x/y getters/setters make the inheritance benefit slim
to none - and the added complexity makes the hierarchy less than desirable.

Should a Segment be two points? Or one point and a vector?
If the length is requested regularly, the optimized Vector class would be better.
If the endpoints are changing, two points would be better.

Why not allow a Segment to accept Vectors as construction vertices?

"Grammatical correctness". If the Vectors were implicitly converted to points
the x/y components would need to be extracted. Either input Vectors could be
magnitude/angle arranged which would incur additional unbeknownst computation.

<b>TENANT-1: All structures use the same getters. i.e. vector.x, segment.b.x, point.x </b>
<b>TENANT-2: Construction shall not have a computation cost.</b>
<b>TENANT-3: Logical grammar required. i.e. Two Point structures cannot be added together. </b>
<b>TENANT-4: Counter-clockwise is positive. Clockwise is negative. </b>
<b>TENANT-5: All angles are bounded to [0, 360) </b>
<b>TENANT-5: Magnitude/length/distance is always positive. </b>

You can't add Points together.
You can add a vector to a point.
point.plus(vector)
point.add(vector);

Cannot set length of a Segment. Unclear if A is moving or B is moving or both.

All structure operations modify the target. Use `copy` to create new target first if necessary.

CHANGES:
- `directionTo()` positive is clockwise
- orientation flipped CW and CCW
- Drop `line()` in Segment.

- Polygon `edges()` now is `edges`.
- Force all memoized fields to compute with `preprocess()`.
- Polygon `containsPoint` determines points on edge endpoints to be contained
- Vector and Point now support Infinity as their component values. (No longer need Ray, Line, or `x: 9999999`)
- Polygon flipped clockwise

- vector cross renamed to crossProduct

- extrudeVertices removed first param `vertices`

- removed isZero
- removed diffNormalized

Reworked: Segment, Vector, Point

Rectify `intersects`, `containsPoint`, `isOnSegment`.

isOnSegment - true if overlapping segment or its endpoints
containsPoint - internal or boundary overlap

Utilize Object.seal(someObj) in the constructor of the object after all memoize-able properties are defined



export function testBigNumber() {
  let min = minNumber();

  // MIN_VALUE -> 5.00E-324
  // 1 + (Number.MIN_VALUE / 5e-309) === 1 -> true
  // 1 + (Number.MIN_VALUE / 5e-308) === 1 -> false
  // 1 + 1e-16 === 1 -> true
  // 1 + 1e-15 === 1 -> false

  // Same as 0 + 1e-16 but prints in scientific notation
  console.log(1e0 + 1e-16); // -> 1
  console.log(1e0 + 1e-15); // -> 1.000000000000001

  console.log(1e1 + 1e-16); // -> 10
  console.log(1e1 + 1e-15); // -> 10.000000000000002

  console.log(1e2 + 1e-15); // -> 100
  console.log(1e2 + 1e-14); // -> 100.00000000000001

  console.log(1e3 + 1e-14); // -> 1000
  console.log(1e3 + 1e-13); // -> 1000.0000000000001

  console.log(1e4 + 1e-13); // -> 10000
  console.log(1e4 + 1e-12); // -> 10000.000000000002

  console.log(1e5 + 1e-12); // -> 100000
  console.log(1e5 + 1e-11); // -> 100000.00000000001

  console.log(1e6 + 1e-11); // -> 1000000
  console.log(1e6 + 1e-10); // -> 1000000.0000000001
}


