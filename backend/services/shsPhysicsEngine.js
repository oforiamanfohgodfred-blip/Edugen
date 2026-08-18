/* =========================================================
   EduGen SHS PHYSICS ENGINE
   ---------------------------------------------------------
   Dynamic question families for SHS Physics.
   This module is intentionally independent from questionEngine.js
   until the integration/validation stage.
========================================================= */

const crypto = require("crypto");

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (items) => items[Math.floor(Math.random() * items.length)];
const round = (value, dp = 2) => Number(value.toFixed(dp));
const id = () => crypto.randomBytes(8).toString("hex");

function distractors(correct, values) {
  return [...new Set(values.filter((v) => String(v) !== String(correct)))].slice(0, 3);
}

function build({ grade, topic, difficulty, family, question, answer, options, explanation }) {
  const allOptions = [String(answer), ...distractors(answer, options)].slice(0, 4);
  for (let i = allOptions.length; i < 4; i += 1) {
    allOptions.push(String(answer));
  }
  for (let i = allOptions.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  return {
    id: id(),
    question,
    options: allOptions,
    answer: String(answer),
    correctAnswer: String(answer),
    questionType: "Multiple Choice",
    subject: "Physics",
    grade,
    level: grade,
    topic,
    difficulty,
    questionFamily: family,
    explanation,
    learningObjective: `Apply ${topic.toLowerCase()} principles in a ${family.replace(/-/g, " ")} context.`,
  };
}

function mechanics(grade, difficulty, family) {
  if (family === "calculation") {
    const u = randomInt(2, 20);
    const a = randomInt(1, 6);
    const t = randomInt(2, 8);
    const v = u + a * t;
    return build({ grade, topic: "Mechanics", difficulty, family, question: `An object has an initial velocity of ${u} m/s and accelerates uniformly at ${a} m/s² for ${t} s. What is its final velocity?`, answer: `${v} m/s`, options: [`${u + a} m/s`, `${u * a * t} m/s`, `${v + t} m/s`], explanation: `Use v = u + at = ${u} + (${a} × ${t}) = ${v} m/s.` });
  }
  if (family === "application") {
    const mass = randomInt(2, 15);
    const acceleration = randomInt(2, 8);
    const force = mass * acceleration;
    return build({ grade, topic: "Mechanics", difficulty, family, question: `A ${mass} kg trolley accelerates at ${acceleration} m/s². What resultant force acts on it?`, answer: `${force} N`, options: [`${mass + acceleration} N`, `${force + mass} N`, `${acceleration} N`], explanation: `F = ma = ${mass} × ${acceleration} = ${force} N.` });
  }
  if (family === "data-interpretation") {
    const d1 = randomInt(20, 80);
    const d2 = randomInt(20, 80);
    const t = randomInt(4, 10);
    const s1 = round(d1 / t, 1);
    const s2 = round(d2 / t, 1);
    const answer = s1 > s2 ? "First interval" : s2 > s1 ? "Second interval" : "Both intervals";
    return build({ grade, topic: "Mechanics", difficulty, family, question: `An object travels ${d1} m in ${t} s during the first interval and ${d2} m in ${t} s during the second. During which interval is its average speed greater?`, answer, options: [answer === "First interval" ? "Second interval" : "First interval", "They are both zero", "There is insufficient information"], explanation: `The speeds are ${s1} m/s and ${s2} m/s respectively.` });
  }
  return build({ grade, topic: "Mechanics", difficulty, family, question: "Which statement correctly describes inertia?", answer: "An object's resistance to a change in its state of motion.", options: ["The force that always causes acceleration", "The energy stored in a spring", "The speed of a moving object"], explanation: "Inertia is the tendency of an object to resist changes in its motion." });
}

function workEnergyPower(grade, difficulty, family) {
  if (family === "calculation") {
    const force = randomInt(20, 100);
    const distance = randomInt(2, 15);
    const work = force * distance;
    return build({ grade, topic: "Work, Energy and Power", difficulty, family, question: `A constant force of ${force} N moves an object ${distance} m in the direction of the force. How much work is done?`, answer: `${work} J`, options: [`${force + distance} J`, `${force / distance} J`, `${distance} J`], explanation: `W = Fd = ${force} × ${distance} = ${work} J.` });
  }
  if (family === "application") {
    const energy = randomInt(200, 900);
    const time = randomInt(2, 9);
    const power = round(energy / time, 1);
    return build({ grade, topic: "Work, Energy and Power", difficulty, family, question: `A machine transfers ${energy} J of energy in ${time} s. What is its average power?`, answer: `${power} W`, options: [`${energy * time} W`, `${energy + time} W`, `${time / energy} W`], explanation: `P = E/t = ${energy}/${time} = ${power} W.` });
  }
  return build({ grade, topic: "Work, Energy and Power", difficulty, family, question: "Which statement expresses conservation of energy?", answer: "Energy is transferred or transformed but the total energy is conserved.", options: ["Energy can be created from nothing", "Energy disappears whenever work is done", "Only kinetic energy can exist"], explanation: "Energy changes form or moves between systems, but the total amount is conserved." });
}

function electricity(grade, difficulty, family) {
  if (family === "calculation") {
    const voltage = randomInt(6, 24);
    const resistance = randomInt(2, 12);
    const current = round(voltage / resistance, 2);
    return build({ grade, topic: "Electricity", difficulty, family, question: `A resistor of ${resistance} Ω is connected across a ${voltage} V supply. What current flows through it?`, answer: `${current} A`, options: [`${round(voltage * resistance, 2)} A`, `${round(resistance / voltage, 2)} A`, `${voltage + resistance} A`], explanation: `Using I = V/R, I = ${voltage}/${resistance} = ${current} A.` });
  }
  if (family === "comparison") {
    return build({ grade, topic: "Electricity", difficulty, family, question: "In a simple series circuit, what happens to the current at different points in the same uninterrupted loop?", answer: "It is the same at every point.", options: ["It is always zero after the first component", "It doubles after each resistor", "It changes randomly at every point"], explanation: "A series circuit has one path for charge flow, so the current is the same throughout the loop." });
  }
  return build({ grade, topic: "Electricity", difficulty, family, question: "Why is a fuse included in an electrical circuit?", answer: "It melts and breaks the circuit when excessive current flows.", options: ["It increases the supply voltage", "It stores unlimited electrical energy", "It guarantees zero resistance"], explanation: "A fuse protects a circuit by melting when current exceeds its safe rating." });
}

function waves(grade, difficulty, family) {
  if (family === "calculation") {
    const frequency = randomInt(5, 25);
    const wavelength = randomInt(2, 12) / 10;
    const speed = round(frequency * wavelength, 2);
    return build({ grade, topic: "Waves", difficulty, family, question: `A wave has frequency ${frequency} Hz and wavelength ${wavelength} m. What is its speed?`, answer: `${speed} m/s`, options: [`${round(frequency / wavelength, 2)} m/s`, `${round(wavelength / frequency, 2)} m/s`, `${frequency + wavelength} m/s`], explanation: `v = fλ = ${frequency} × ${wavelength} = ${speed} m/s.` });
  }
  return build({ grade, topic: "Waves", difficulty, family, question: "Which quantity measures the number of complete wave cycles passing a point each second?", answer: "Frequency.", options: ["Amplitude", "Wavelength", "Displacement"], explanation: "Frequency is the number of complete cycles per second and is measured in hertz." });
}

const GENERATORS = {
  Mechanics: mechanics,
  "Work, Energy and Power": workEnergyPower,
  Electricity: electricity,
  Waves: waves,
};

const FAMILIES = ["calculation", "application", "data-interpretation", "comparison", "concept", "experimental"];

function generateSHSPhysicsQuestion({ grade = "SHS1", topic, difficulty = "Medium", family }) {
  const generator = GENERATORS[topic];
  if (!generator) return null;
  const selectedFamily = family || randomChoice(FAMILIES);
  return generator(grade, difficulty, selectedFamily);
}

function generateSHSPhysicsQuestions({ grade = "SHS1", topic, difficulty = "Medium", count = 1 }) {
  const result = [];
  const seen = new Set();
  const maxAttempts = Math.max(count * 50, 100);
  for (let attempt = 0; attempt < maxAttempts && result.length < count; attempt += 1) {
    const question = generateSHSPhysicsQuestion({ grade, topic, difficulty });
    if (!question) break;
    const key = question.question.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(question);
  }
  return result;
}

module.exports = {
  FAMILIES,
  GENERATORS,
  generateSHSPhysicsQuestion,
  generateSHSPhysicsQuestions,
};
