const crypto = require("crypto");

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (items) => items[randomInt(0, items.length - 1)];
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const id = () => crypto.randomBytes(8).toString("hex");

const GRADE_FACTOR = { JHS1: 1, JHS2: 1.25, JHS3: 1.5 };
const difficultyLevel = { Easy: 0, Medium: 1, Hard: 2, Expert: 3 };

function scale(grade, difficulty, base = 10) {
  const factor = GRADE_FACTOR[grade] || 1;
  const difficultyFactor = 1 + (difficultyLevel[difficulty] || 0) * 0.35;
  return Math.max(2, Math.round(base * factor * difficultyFactor));
}

function mcq({ question, answer, distractors, grade, topic, difficulty, family, explanation }) {
  return {
    id: id(), question, options: shuffle([answer, ...distractors]), answer,
    correctAnswer: answer, questionType: "Multiple Choice", subject: "Integrated Science",
    grade, level: grade, topic, difficulty, questionFamily: family,
    explanation, learningObjective: `Apply knowledge of ${topic}.`,
  };
}

function makeMatter(grade, difficulty) {
  const mass = scale(grade, difficulty, 20);
  const volume = randomInt(2, Math.max(3, Math.round(mass / 2)));
  const density = +(mass / volume).toFixed(2);
  return mcq({ grade, topic: "Matter", difficulty, family: "application",
    question: `A sample has a mass of ${mass} g and a volume of ${volume} cm³. What is its density?`,
    answer: `${density} g/cm³`,
    distractors: [`${mass + volume} g/cm³`, `${+(mass * volume).toFixed(2)} g/cm³`, `${+(volume / mass).toFixed(2)} g/cm³`],
    explanation: `Density = mass ÷ volume = ${mass} ÷ ${volume} = ${density} g/cm³.` });
}

function makeMotion(grade, difficulty) {
  const time = randomInt(4, scale(grade, difficulty, 12));
  const speed = randomInt(2, scale(grade, difficulty, 10));
  const distance = speed * time;
  return mcq({ grade, topic: "Forces and Motion", difficulty, family: "calculation",
    question: `A cyclist travels at ${speed} m/s for ${time} s. How far does the cyclist travel?`,
    answer: `${distance} m`,
    distractors: [`${speed + time} m`, `${speed * time + speed} m`, `${Math.max(1, distance - time)} m`],
    explanation: `Distance = speed × time = ${speed} × ${time} = ${distance} m.` });
}

function makeEnergy(grade, difficulty) {
  const power = randomInt(20, scale(grade, difficulty, 100));
  const time = randomInt(2, 8);
  const energy = power * time;
  return mcq({ grade, topic: "Energy", difficulty, family: "calculation",
    question: `A device operates at ${power} W for ${time} s. How much energy does it use?`,
    answer: `${energy} J`,
    distractors: [`${power + time} J`, `${power / time} J`, `${energy + power} J`],
    explanation: `Energy = power × time = ${power} × ${time} = ${energy} J.` });
}

const CONCEPTS = {
  "Living Things": [
    ["A plant bends toward a light source. What response is shown?", "Response to a stimulus.", ["Digestion", "Excretion", "Reproduction"]],
    ["Which process allows living organisms to release energy from food?", "Respiration.", ["Photosynthesis", "Transpiration", "Germination"]],
  ],
  Cells: [
    ["Which structure controls many activities of a typical plant or animal cell?", "Nucleus.", ["Cell wall", "Vacuole", "Cytoplasm"]],
    ["Which structure controls movement of substances into and out of a cell?", "Cell membrane.", ["Nucleus", "Ribosome", "Chloroplast"]],
  ],
  "Human Body": [
    ["Which organ pumps blood around the body?", "Heart.", ["Lungs", "Kidney", "Stomach"]],
    ["Why does breathing rate increase during vigorous exercise?", "The muscles require more oxygen and produce more carbon dioxide.", ["The muscles stop respiring.", "The lungs stop exchanging gases.", "The body stops producing energy."]],
  ],
  Reproduction: [
    ["What is reproduction?", "The production of new individuals by living organisms.", ["The digestion of food", "The movement of blood", "The removal of waste only"]],
    ["Which process involves genetic material from two parents?", "Sexual reproduction.", ["Binary fission", "Budding", "Asexual reproduction"]],
  ],
  Ecology: [
    ["In grass → grasshopper → frog, what is the grasshopper?", "A primary consumer.", ["Producer", "Secondary consumer", "Decomposer"]],
    ["What is an ecosystem?", "Organisms interacting with one another and with their physical environment.", ["Animals only", "Plants only", "Soil only"]],
  ],
  "Earth and Space": [
    ["What mainly causes day and night?", "Earth's rotation on its axis.", ["Earth's revolution around the Sun", "The Moon's rotation", "Cloud movement"]],
    ["Which object produces its own light?", "The Sun.", ["The Moon", "Earth", "Mars"]],
  ],
  Health: [
    ["Which practice reduces the spread of many infectious diseases?", "Regular handwashing with soap and clean water.", ["Sharing needles", "Ignoring sanitation", "Drinking contaminated water"]],
    ["Why is safe drinking water important?", "It reduces exposure to disease-causing organisms and harmful substances.", ["It prevents every illness", "It replaces food", "It prevents all injuries"]],
  ],
};

function makeConcept(grade, topic, difficulty) {
  const rows = CONCEPTS[topic];
  if (!rows) return null;
  const [question, answer, distractors] = randomItem(rows);
  return mcq({ grade, topic, difficulty, family: "concept", question, answer, distractors,
    explanation: `The correct answer is ${answer}` });
}

function makeDataQuestion(grade, difficulty) {
  const first = randomInt(2, scale(grade, difficulty, 8));
  const second = randomInt(2, scale(grade, difficulty, 12));
  const answer = first + second;
  return mcq({ grade, topic: "Ecology", difficulty, family: "data-interpretation",
    question: `A field survey records ${first} grasshoppers in one area and ${second} in another. How many grasshoppers were recorded altogether?`,
    answer: `${answer}`,
    distractors: [`${Math.abs(first - second)}`, `${first * second}`, `${answer + 2}`],
    explanation: `${first} + ${second} = ${answer}.` });
}

function makeInvestigation(grade, topic, difficulty) {
  const rows = {
    Matter: ["A learner compares evaporation of two liquids. Which variable should be controlled?", "The starting volume of each liquid.", ["The conclusion", "The result", "The learner's favourite liquid"]],
    Energy: ["A learner compares thermal insulators. What should be measured to compare their performance?", "Temperature change over the same period.", ["The colour of the materials only", "The classroom name", "The learner's opinion"]],
    Cells: ["Why may a stain be used when viewing cells under a microscope?", "To increase contrast so structures are easier to see.", ["To turn cells into tissues", "To remove the nucleus", "To permanently enlarge cells"]],
  };
  const row = rows[topic];
  if (!row) return makeConcept(grade, topic, difficulty);
  return mcq({ grade, topic, difficulty, family: "investigation", question: row[0], answer: row[1], distractors: row[2], explanation: `A fair investigation controls relevant variables and measures the chosen outcome.` });
}

function generateJHSIntegratedScienceQuestion({ grade = "JHS1", topic, difficulty = "Medium", family }) {
  if (topic === "Matter") return family === "investigation" ? makeInvestigation(grade, topic, difficulty) : makeMatter(grade, difficulty);
  if (topic === "Forces and Motion") return makeMotion(grade, difficulty);
  if (topic === "Energy") return family === "investigation" ? makeInvestigation(grade, topic, difficulty) : makeEnergy(grade, difficulty);
  if (topic === "Ecology" && family === "data-interpretation") return makeDataQuestion(grade, difficulty);
  if (family === "investigation") return makeInvestigation(grade, topic, difficulty);
  return makeConcept(grade, topic, difficulty);
}

function generateJHSIntegratedScienceQuestions({ grade = "JHS1", topic, difficulty = "Medium", count = 1 }) {
  const questions = [];
  const seen = new Set();
  const families = ["concept", "application", "comparison", "cause-effect", "data-interpretation", "investigation", "misconception", "expert-reasoning"];
  let attempts = 0;
  const maxAttempts = Math.max(100, count * 80);

  while (questions.length < count && attempts++ < maxAttempts) {
    const family = randomItem(families);
    const question = generateJHSIntegratedScienceQuestion({ grade, topic, difficulty, family });
    if (!question) continue;
    const key = question.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push(question);
  }
  return questions;
}

module.exports = { generateJHSIntegratedScienceQuestion, generateJHSIntegratedScienceQuestions };
