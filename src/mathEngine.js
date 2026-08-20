const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export const simplifyFraction = (n, d) => {
  if (d === 0) return null;
  const sign = d < 0 ? -1 : 1;
  n *= sign; d *= sign;
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};

export const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "Undefined";
  if (Math.abs(value - Math.round(value)) < 1e-10) return String(Math.round(value));
  return String(Number(value.toFixed(8)));
};

const tokenize = (input) => input.replace(/\s+/g, "").replace(/−/g, "-").match(/\d*\.?\d+|[+\-*/^()] /g);

const tokens = (input) => {
  const out = [];
  const re = /\d*\.?\d+|[+\-*/^()]/g;
  let m;
  while ((m = re.exec(input.replace(/\s+/g, "").replace(/−/g, "-")))) out.push(m[0]);
  return out;
};

export const evaluateExpression = (input) => {
  const t = tokens(input);
  let i = 0;
  if (!t.length) throw new Error("Enter a mathematical expression.");

  const primary = () => {
    const x = t[i];
    if (x === "+") { i++; return primary(); }
    if (x === "-") { i++; return -primary(); }
    if (x === "(") { i++; const v = addSub(); if (t[i] !== ")") throw new Error("Missing closing bracket."); i++; return v; }
    if (x === undefined || Number.isNaN(Number(x))) throw new Error(`Unexpected symbol: ${x || "end"}`);
    i++; return Number(x);
  };
  const power = () => {
    let left = primary();
    if (t[i] === "^") { i++; left = left ** power(); }
    return left;
  };
  const mulDiv = () => {
    let left = power();
    while (t[i] === "*" || t[i] === "/") {
      const op = t[i++]; const right = power();
      if (op === "/" && right === 0) throw new Error("Division by zero is not allowed.");
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };
  const addSub = () => {
    let left = mulDiv();
    while (t[i] === "+" || t[i] === "-") {
      const op = t[i++]; const right = mulDiv();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };
  const result = addSub();
  if (i < t.length) throw new Error(`Unexpected symbol: ${t[i]}`);
  return result;
};

const parseLinearSide = (side) => {
  let s = side.replace(/\s+/g, "").replace(/−/g, "-").replace(/\*/g, "");
  if (!s) return { a: 0, b: 0 };
  if (!/[xX]/.test(s)) return { a: 0, b: evaluateExpression(s) };
  s = s.replace(/X/g, "x");
  const parts = s.match(/[+-]?[^+-]+/g) || [];
  let a = 0, b = 0;
  for (let term of parts) {
    if (term === "+" || term === "-") continue;
    const sign = term.startsWith("-") ? -1 : 1;
    term = term.replace(/^[+-]/, "");
    if (term.includes("x")) {
      const coefficient = term.replace("x", "") || "1";
      a += sign * Number(coefficient);
    } else b += sign * Number(term);
  }
  return { a, b };
};

export const solveLinearEquation = (input) => {
  if (!input.includes("=")) throw new Error("Use an equation such as 3x + 5 = 20.");
  const [left, right] = input.split("=");
  const L = parseLinearSide(left); const R = parseLinearSide(right);
  const coefficient = L.a - R.a;
  const constant = R.b - L.b;
  if (Math.abs(coefficient) < 1e-12) {
    if (Math.abs(constant) < 1e-12) return { type: "infinite", answer: "All real numbers", steps: ["Collect x terms on one side.", "The x terms cancel and both sides are equal.", "Therefore every real value of x satisfies the equation."] };
    return { type: "none", answer: "No solution", steps: ["Collect x terms on one side.", "The x terms cancel.", "A non-zero constant remains, which is impossible."] };
  }
  const x = constant / coefficient;
  return {
    type: "linear",
    answer: `x = ${formatNumber(x)}`,
    steps: [
      `Move x terms together: ${formatNumber(coefficient)}x = ${formatNumber(constant)}.`,
      `Divide both sides by ${formatNumber(coefficient)}.`,
      `x = ${formatNumber(x)}.`,
      `Check: substitute x = ${formatNumber(x)} into the original equation.`
    ],
    value: x
  };
};

export const solveMath = (input, mode) => {
  if (mode === "Equation Solver" || input.includes("=")) return solveLinearEquation(input);
  const value = evaluateExpression(input);
  return { type: "expression", answer: formatNumber(value), value, steps: ["Apply brackets first.", "Evaluate powers before multiplication or division.", "Complete multiplication/division before addition/subtraction.", `Therefore the answer is ${formatNumber(value)}.`] };
};
