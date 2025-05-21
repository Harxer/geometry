import { romberg } from './integrate.js';
import { equals, isZero } from '../../geometry.js';

const MAX_ITERATIONS = 4096;
const DEFAULT_ROMBERG_ORDER = 8;
const DEFAULT_MAX_BISECTIONS = 1024
const SUP_ORDER = 4;

// TODO - linear impl not great, assumes arr is sorted ASC
const lower_bound = (arr, start, end, target) => {
  let i = arr.slice(start, end).findIndex(elem => elem > target);
  if (i === -1) {
    i = arr.length;
  }
  return i;
};

function Normalize(v) {
  let length = Length(v);
  if (length > 0) {
    let invLength = 1 / length;
    for(let i = 0; i < v.length; i++) {
      v[i] *= invLength;
    }
  } else {
    v.fill(0);
  }
  return length;
}
function Length(v) {
  // sqrt(dot(v, v))
  return Math.sqrt(v.reduce((total, component) => total + component * component, 0));
}

const Output = (t, f, numIterations) => ({t, f , numIterations});

export class Polynomial1 {
  constructor(degree, values) {
    this.mCoefficient = [degree + 1, 0];
    if (values) {
      this.mCoefficient = Array(values.length);
      values.forEach((value, i) => this.mCoefficient[i] = value);
      this.eliminateLeadingZeros();
    }
  }
  eliminateLeadingZeros() {
    let size = this.mCoefficient.length;
    if (size > 1) {
      let leading;
      for (leading = size - 1; leading > 0; --leading) {
        if (this.mCoefficient[leading] != 0) {
          break;
        }
      }
      this.mCoefficient.length = ++leading;
    }
  }
  getDegree() {
    return this.mCoefficient.length - 1;
  }
  getDerivative() {
    let degree = this.getDegree();
    if (degree > 0) {
      let result = new Polynomial1(degree - 1);
      for (let i0 = 0, i1 = 1; i0 < degree; ++i0, ++i1) {
        result.mCoefficient[i0] = this.mCoefficient[i1] * i1;
      }
      return result;
    } else {
      let result = new Polynomial1(0);
      result[0] = 0;
      return result;
    }
  }
  evaluate(t) {
    let i = this.mCoefficient.length;
    let result = this.mCoefficient[--i];
    for (--i; i >= 0; --i) {
      result *= t;
      result += this.mCoefficient[i];
    }
    return result;
  }
}
class ParametricCurve {
  constructor(N, tMin, tMax) {
    this.N = N;
    this.mAccumulatedLength = [1, 0];
    this.mTime = [tMin, tMax];
    this.mSegmentLength = [1, 0];
    this.mRombergOrder = DEFAULT_ROMBERG_ORDER;
    this.mMaxBisections = DEFAULT_MAX_BISECTIONS;
    this.mConstructed = false;
  }
  // constructor(numSegments, times) {
  //  // TODO implement segments ctor for contiguous curves support
  // }
  getTMin() {
    return this.mTime[0];
  }
  getTMax() {
    return this.mTime[this.mTime.length - 1];
  }
  /** Virtual - must be implemented by base classes */
  evaluate() {
    throw Error('evaluate() NYI');
  }
  getPosition(t) {
    let jet = Array(SUP_ORDER).fill(Array(this.N));
    this.evaluate(t, 0, jet);
    return jet[0];
  }
  getTangent(t) {
    let jet = Array(SUP_ORDER).fill(Array(this.N));
    this.evaluate(t, 1, jet);
    Normalize(jet[1]);
    return jet[1];
  }
  getSpeed(t) {
    let jet = Array(SUP_ORDER).fill(Array(this.N));
    this.evaluate(t, 1, jet);
    return Length(jet[1])
  }
  getLength(t0, t1) {
    const speed = t => this.getSpeed(t);

    if (isZero(this.mSegmentLength[0])) {
      let numSegments = this.mSegmentLength.length;
      let accumulated = 0;
      for (let i = 0, ip1 = 1; i < numSegments; ++i, ++ip1) {
        this.mSegmentLength[i] = romberg(this.mRombergOrder, this.mTime[i], this.mTime[ip1], speed);
        accumulated += this.mSegmentLength[i];
        this.mAccumulatedLength[i] = accumulated;
      }
    }

    t0 = Math.max(t0, this.getTMin());
    t1 = Math.min(t1, this.getTMax());
    let iter0 = lower_bound(this.mTime, 0, this.mTime.length, t0);
    let index0 = iter0; // TODO: verify. iter0 subtracted from mTime 0, should just be iter0
    let iter1 = lower_bound(this.mTime, 0, this.mTime.length, t1);
    let index1 = iter1;  // TODO: verify. iter1 subtracted from mTime 0, should just be iter1
    let length;
    if (index0 < index1) {
      length = 0;
      if (t0 < this.mTime[iter0]) {
        length += romberg(this.mRombergOrder, t0, this.mTime[index0], speed);
      }

      let isup;
      if (t1 < this.mTime[iter1]) {
        length += romberg(this.mRombergOrder, this.mTime[index1 - 1], t1, speed);
        isup = index1 - 1;
      } else {
        isup = index1;
      }

      for (let i = index0; i < isup; ++i) {
        length += this.mSegmentLength[i];
      }
    } else {
      length = romberg(this.mRombergOrder, t0, t1, speed);
    }
    return length;
  }
  get lastMTime() {
    return this.mAccumulatedLength[this.mAccumulatedLength.length - 1];
  }
  getTotalLength() {
    if (isZero(this.lastMTime)) {
      return this.getLength(this.mTime[0], this.lastMTime);
    }
    return this.lastMTime;
  }
}
export class PolynomialCurve extends ParametricCurve {
  constructor(tMin, tMax, components) {
    let N = components.length;
    super(N, tMin, tMax);

    this.N = N;
    this.mPolynomial = Array(N);
    this.mDer1Polynomial = Array(N);
    this.mDer2Polynomial = Array(N);
    this.mDer3Polynomial = Array(N);

    if (components) {
      for (let i = 0; i < N; ++i) {
        this.setPolynomial(i, components[i]);
      }
    }
  }
  setPolynomial(i, poly) {
    this.mPolynomial[i] = poly;
    this.mDer1Polynomial[i] = this.mPolynomial[i].getDerivative();
    this.mDer2Polynomial[i] = this.mDer1Polynomial[i].getDerivative();
    this.mDer3Polynomial[i] = this.mDer2Polynomial[i].getDerivative();
  }
  // implement evaluate from virtual baseclass
  evaluate(t, order, jet) {
    for (let i = 0; i < this.N; ++i) {
      jet[0][i] = this.mPolynomial[i].evaluate(t);
    }

    if (order >= 1) {
      for (let i = 0; i < this.N; ++i) {
        jet[1][i]= this.mDer1Polynomial[i].evaluate(t);
      }

      if (order >= 2) {
        for (let i = 0; i < this.N; ++i) {
          jet[2][i] = this.mDer2Polynomial[i].evaluate(t);
        }

        if (order == 3) {
          for (let i = 0; i < this.N; ++i) {
            jet[3][i] = this.mDer3Polynomial[i].evaluate(t);
          }
        }
      }
    }
  }
}
export class ReparameterizeByArcLength {
  constructor(curve) {
    if (!curve) throw Error('Curve must be passed.')

    /** X(t) for t in [tMin, tMax] */
    this.mCurve = curve;
    /** @type {int} */
    this.mTMin = curve.getTMin();
    /** @type {int} */
    this.mTMax = curve.getTMax();
    /** @type {int} Length of the curve estimated by numerical integration of the speed. */
    this.mTotalArcLength = curve.getTotalLength();
  }

  /**
   * Process interpolation of curve length
   * @param {int} s arclength
   * @param {boolean} useBisection only use Bisection (not hybrid with Newton's)
   */
  getT(s, useBisection) {
    if (s <= 0) {
      return Output(this.mTMin, 0, 0);
    }

    if (s >= this.mTotalArcLength) {
      return Output(this.mTMax, 0 , 0);
    }

    let tMin = this.mTMin;
    let tMax = this.mTMax;
    let mid = {t: tMin + (tMax - tMin) * (s / this.mTotalArcLength)};
    let fMid = this.F(mid.t, s);
    if (fMid < 0) {
      tMax = mid.t;
    } else {
      tMin = mid.t;
    }

    if (useBisection) {
      return this.DoBisection(tMin, tMax, s);
    } else {
      return this.doNewtonsMethod(tMin, tMax, mid, s);
    }
  }

  /**
   * Compute arc length at interpolated value
   * @param {int} t interlopated value
   * @param {int} s arclength
   * @returns
   */
  F(t, s) {
    return this.mCurve.getLength(this.mTMin, t) - s;
  }

  /**
   * Compute first derivative at interpolated value of curve.
   * @param {int} t interpolated value
   * @returns
   */
  DFDT(t) {
    return this.mCurve.getSpeed(t);
  }

  /** Updates `mid` reference and returns convergence. */
  bisectionConverged(tMin, tMax, s, mid) {
    if (equals(mid.t, tMin) || equals(mid.t, tMax)) {
      let fMin = this.F(tMin, s);
      let fMax = this.F(tMax, s);
      if (fMin <= fMax) {
        mid.t = tMin;
        mid.f = fMin;
      } else {
        mid.t = tMax;
        mid.f = fMax;
      }
      return true;
    }
    return false;
  }

  /**
   * Perform bisection
   * @param {int} tMin
   * @param {int} tMax
   * @param {int} s arclength
   */
  DoBisection(tMin, tMax, s) {
    let mid = {f: 0, t: 0};
    let numIterations = 0;

    for (numIterations = 1; numIterations <= MAX_ITERATIONS; ++numIterations) {
      mid.t = 0.5 * (tMin + tMax);
      mid.f = this.F(mid.t, s);
      if (isZero(mid.f)) {
        break;
      }

      if (this.bisectionConverged(tMin, tMax, s, mid)) {
        break;
      }

      if (mid.f > 0) {
        tMax = mid.t;
      } else {
        tMin = mid.t;
      }
    }

    return Output(mid.t, mid.f, numIterations);
  }

  doNewtonsMethod(tMin, tMax, mid, s) {
    const tIerates = new Set();
    // Create fMid on mid for this scope (delete at end)
    mid.f = 0;
    let numIterations = 0;

    for (numIterations = 1; numIterations <= MAX_ITERATIONS; ++numIterations) {
      // mid.t iterate visited previously - cycle occurred
      if (tIerates.has(mid.t)) {
        break;
      }
      tIerates.add(mid.t);

      // Eval F(mid.t)
      mid.f = this.F(mid.t, s);
      if (isZero(mid.f)) {
        break;
      }

      // Update bisection interval knowing sign of F(mid.t), current mid.t becomes endpoint of this interval
      if (mid.f > 0) {
        tMax = mid.t;
      } else {
        tMin = mid.t;
      }

      // Eval F'(mid.t) >= 0. Bisection step taken to avoid division by zero
      let dfdt = this.DFDT(mid.t);
      if (isZero(dfdt)) {
        // Avoid div by zero
        mid.t = 0.5 * (tMin + tMax);
        if (this.bisectionConverged(tMin, tMax, s, mid)) {
          break;
        }
      }

      let tNext = mid.t - mid.f / dfdt;
      if (equals(tNext, mid.t)) {
        // Precision not large enough to distinguish mid.t and tNext
        break;
      }

      // Determine if Newton step OK or need bisection step
      mid.t = tNext;
      if (mid.t < tMin || mid.t < tMax) {
        // Iterate outside root-bounding interval. Try bisection
        mid.t = 0.5 * (tMin + tMax);
        if (this.bisectionConverged(tMin, tMax, s, mid)) {
          break;
        }
      }
    }

    // Clear local scope fMid
    let midF = mid.f;
    delete mid.f;
    return Output(mid.t, midF, numIterations);
  }
}
