

function trapezoidRule(numSamples, a, b, integrandFn) {
  let h = (b - a) / (numSamples - 1);
  let result = 0.5 * (integrandFn(a) + integrandFn(b));
  for (let i = 1; i <= numSamples - 2; ++i) {
    result += integrandFn(a + i * h);
  }
  result *= h;
  return result;
}

export function romberg(order, a, b, integrandFn) {
  let rom = Array(order).fill(Array(2));
  let h = b - a;
  rom[0][0] = (0.5) * h * (integrandFn(a) + integrandFn(b));
  for (let i0 = 2, p0 = 1; i0 <= order; ++i0, p0 *= 2, h *= 0.5) {
    let sum = 0;
    let i1;
    for (i1 = 1; i1 <= p0; ++i1) {
      sum += integrandFn(a + h * (i1 - 0.5));
    }

    rom[0][1] = 0.5 * (rom[0][0] + h * sum);
    for (let i2 = 1, i2m1 = 0, p2 = 4; i2 < i0; ++i2, ++i2m1, p2 *= 4) {
      rom[i2][1] = (p2 * rom[i2m1][1] - rom[i2m1][0]) / (p2 - 1);
    }

    for (i1 = 0; i1 < i0; ++i1) {
      rom[i1][0] = rom[i1][1];
    }
  }
  let result = rom[order - 1][0];
  return result;
}
