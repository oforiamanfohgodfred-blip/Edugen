/* =========================================================
   EduGen MASTER GENERATION ENGINE
   ---------------------------------------------------------
   Single entry point for the upgraded generator.
   - Strict Ghana curriculum validation
   - JHS1-JHS3 + SHS1-SHS3 only
   - JHS Integrated Science
   - SHS Physics/Chemistry/Biology
   - Existing Mathematics engine preserved
   - Native question-type conversion
   - Exact-count retry logic
========================================================= */

const crypto = require("crypto");
const legacyMath = require("./questionEngine");
const curriculum = require("./curriculumEngine");
const { generateJHSIntegratedScienceQuestion } = require("./integratedScienceGeneratorV2");
const { generateSHSPhysicsQuestion } = require("./shsPhysicsEngine");

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (items) => items[randomInt(0, items.length - 1)];
const id = () => crypto.randomBytes(8).toString("hex");
const clean = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const chemistryConcepts = {
  Matter: [
    ["Which change is a physical change?", "Melting ice", ["Burning paper", "Rusting iron", "Reacting acid with a base"]],
    ["Which particle has a negative charge?", "Electron", ["Proton", "Neutron", "Nucleus"]],
  ],
  "Atomic Structure": [
    ["What determines the atomic number of an element?", "The number of protons", ["The number of neutrons", "The number of shells", "The number of molecules"]],
    ["An atom with 11 protons and 10 electrons has what charge?", "+1", ["-1", "0", "+10"]],
  ],
  "Chemical Bonding": [
    ["What type of bonding involves transfer of electrons between atoms?", "Ionic bonding", ["Covalent bonding", "Metallic bonding", "Hydrogen bonding"]],
    ["A covalent bond is formed when atoms...", "share electrons", ["destroy protons", "share neutrons", "lose their nuclei"]],
  ],
  Stoichiometry: [
    ["What does a balanced chemical equation conserve?", "The number of atoms of each element", ["The number of molecules on each side", "The temperature", "The colour of the reactants"]],
  ],
  "Chemical Reactions": [
    ["What is a catalyst?", "A substance that changes reaction rate without being permanently consumed", ["A substance always used up first", "A product of every reaction", "A source of protons only"]],
  ],
  "Acids and Bases": [
    ["A solution with pH 3 is...", "acidic", ["neutral", "alkaline", "always concentrated"]],
    ["What is formed when a strong acid reacts with a strong base?", "Salt and water", ["Only oxygen", "Only hydrogen", "A metal"]],
  ],
  "Organic Chemistry": [
    ["Which element is essential in all organic compounds?", "Carbon", ["Sodium", "Iron", "Calcium"]],
  ],
};

const biologyConcepts = {
  "Biology as the Science of Life": [
    ["Which characteristic of living things involves removal of metabolic waste?", "Excretion", ["Nutrition", "Reproduction", "Sensitivity"]],
    ["Why are enzymes important in cells?", "They catalyse biochemical reactions", ["They store all genetic information", "They replace oxygen", "They form bones only"]],
  ],
  "Cell Structure and Functions": [
    ["Which organelle is mainly associated with aerobic respiration?", "Mitochondrion", ["Ribosome", "Cell wall", "Vacuole"]],
    ["Which structure contains genetic material in a typical eukaryotic cell?", "Nucleus", ["Cell wall", "Cell membrane", "Golgi apparatus"]],
  ],
  "Movement of Substances in Living Organisms": [
    ["Movement of particles from a region of higher concentration to lower concentration is...", "diffusion", ["active transport", "photosynthesis", "digestion"]],
    ["Which process requires energy from respiration?", "Active transport", ["Simple diffusion", "Osmosis", "Passive movement"]],
  ],
  "Living Organisms": [
    ["What is the main function of chlorophyll?", "Absorb light energy for photosynthesis", ["Digest proteins", "Pump blood", "Remove urea"]],
  ],
  Ecology: [
    ["What is a producer in a food chain?", "An organism that makes its own food", ["An organism that eats only meat", "A decomposer", "A parasite only"]],
    ["Why are decomposers important?", "They recycle nutrients from dead material", ["They stop all competition", "They produce sunlight", "They eliminate oxygen"]],
  ],
  "Diseases and Infections": [
    ["Which organism causes malaria?", "A Plasmodium parasite", ["A bacterium called Salmonella", "A fungus called yeast", "A virus called HIV"]],
  ],
  "Mammalian Systems": [
    ["Which blood vessel carries blood away from the heart?", "Artery", ["Vein", "Capillary", "Alveolus"]],
    ["Where does most gas exchange occur in the human lungs?", "Alveoli", ["Trachea", "Oesophagus", "Diaphragm"]],
  ],
  "Plant Systems": [
    ["Which tissue transports water and mineral salts upward in a plant?", "Xylem", ["Phloem", "Epidermis", "Stoma"]],
    ["Which tissue transports manufactured food?", "Phloem", ["Xylem", "Root hair", "Cortex"]],
  ],
};

function baseConcept(subject, grade, topic, difficulty, family) {
  const bank = subject === "Chemistry" ? chemistryConcepts[topic] : biologyConcepts[topic];
  if (!bank || !bank.length) return null;
  const [question, answer, distractors] = randomItem(bank);
  return {
    id: id(), subject, grade, level: grade, topic, difficulty, questionFamily: family,
    question, options: [answer, ...distractors].sort(() => Math.random() - 0.5),
    answer, correctAnswer: answer, questionType: "Multiple Choice",
    explanation: `The correct answer is ${answer}.`,
    learningObjective: `Apply knowledge of ${topic}.`,
  };
}

function chemistryCalculation(grade, topic, difficulty) {
  if (topic === "Stoichiometry") {
    const mol = randomInt(2, difficulty === "Expert" ? 40 : 15);
    const mass = mol * 18;
    return {
      id: id(), subject: "Chemistry", grade, level: grade, topic, difficulty,
      questionFamily: "calculation", question: `How many grams are present in ${mol} mol of a substance with molar mass 18 g/mol?`,
      options: [`${mass} g`, `${mol + 18} g`, `${mol * 2} g`, `${Math.max(1, mass - 18)} g`],
      answer: `${mass} g`, correctAnswer: `${mass} g`, questionType: "Multiple Choice",
      explanation: `Mass = amount × molar mass = ${mol} × 18 = ${mass} g.`,
      learningObjective: "Use mole relationships and molar mass.",
    };
  }
  if (topic === "Acids and Bases") {
    const pH = randomInt(1, 13);
    const classification = pH < 7 ? "acidic" : pH === 7 ? "neutral" : "alkaline";
    return {
      id: id(), subject: "Chemistry", grade, level: grade, topic, difficulty,
      questionFamily: "application", question: `A solution has pH ${pH}. How should it be classified?`,
      options: [classification, classification === "acidic" ? "alkaline" : "acidic", "always concentrated", "always dilute"],
      answer: classification, correctAnswer: classification, questionType: "Multiple Choice",
      explanation: `pH below 7 is acidic, 7 is neutral, and above 7 is alkaline.`,
      learningObjective: "Classify aqueous solutions using the pH scale.",
    };
  }
  return null;
}

function biologyApplication(grade, topic, difficulty) {
  if (topic === "Ecology") {
    const producers = randomInt(8, difficulty === "Expert" ? 80 : 30);
    const primary = randomInt(3, Math.max(4, producers));
    return {
      id: id(), subject: "Biology", grade, level: grade, topic, difficulty, questionFamily: "data-interpretation",
      question: `A habitat survey records ${producers} producers and ${primary} primary consumers. What is the ratio of producers to primary consumers in simplest form?`,
      options: [`${simplifyRatio(producers, primary)}`, `${primary}:${producers}`, `${producers + primary}:1`, `1:${producers + primary}`],
      answer: simplifyRatio(producers, primary), correctAnswer: simplifyRatio(producers, primary), questionType: "Multiple Choice",
      explanation: `The ratio ${producers}:${primary} is simplified by dividing both terms by their greatest common divisor.`,
      learningObjective: "Interpret quantitative ecological data.",
    };
  }
  return null;
}

function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }
function simplifyRatio(a, b) { const d = gcd(a, b); return `${a / d}:${b / d}`; }

function generateScienceQuestion({ grade, subject, topic, difficulty, family }) {
  if (grade.startsWith("JHS") && subject === "Integrated Science") {
    return generateJHSIntegratedScienceQuestion({ grade, topic, difficulty, family });
  }
  if (subject === "Physics") {
    return generateSHSPhysicsQuestion({ grade, topic, difficulty, family });
  }
  if (subject === "Chemistry") {
    return chemistryCalculation(grade, topic, difficulty) || baseConcept(subject, grade, topic, difficulty, family);
  }
  if (subject === "Biology") {
    return biologyApplication(grade, topic, difficulty) || baseConcept(subject, grade, topic, difficulty, family);
  }
  return null;
}

function convertType(question, requestedType) {
  const type = String(requestedType || "Multiple Choice").toLowerCase();
  const answer = String(question.answer);
  if (type.includes("true") || type.includes("false")) {
    const makeTrue = Math.random() > 0.5;
    const falseAnswer = question.options && question.options.find((x) => String(x) !== answer) || "an incorrect result";
    return {
      ...question,
      question: `True or False?\n\n${question.question}\n\nThe correct answer is ${makeTrue ? answer : falseAnswer}.`,
      options: ["True", "False"], answer: makeTrue ? "True" : "False", questionType: "True / False",
      explanation: makeTrue ? question.explanation : `${question.explanation} The proposed answer is incorrect; the correct answer is ${answer}.`,
    };
  }
  if (type.includes("fill")) {
    return { ...question, question: question.question.replace(/[.!?]+$/, "") + ".\n\nFill in the blank: __________", options: [], questionType: "Fill in the Blank" };
  }
  if (type.includes("short")) {
    return { ...question, options: [], questionType: "Short Answer" };
  }
  if (type.includes("problem") && !type.includes("word")) {
    return { ...question, options: [], questionType: "Problem Solving", question: `PROBLEM SOLVING\n\n${question.question}\n\nGive only the final answer.` };
  }
  if (type.includes("word")) {
    return { ...question, options: [], questionType: "Word Problems", question: `REAL-WORLD PROBLEM\n\n${question.question}\n\nDetermine the required answer.` };
  }
  return { ...question, questionType: "Multiple Choice" };
}

function generateQuestions(request) {
  const grade = curriculum.normalizeGrade(request.grade || request.level);
  const validation = curriculum.validateRequest({ grade, subject: request.subject, topic: request.topic });
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.code;
    error.details = validation;
    throw error;
  }

  const subject = validation.subject;
  const topic = validation.topic;
  const difficulty = request.difficulty || "Medium";
  const requestedCount = Math.min(Math.max(parseInt(request.count, 10) || 5, 1), 20);
  const result = [];
  const seen = new Set();
  const families = ["concept", "application", "calculation", "comparison", "cause-effect", "data-interpretation", "investigation", "misconception", "expert-reasoning"];
  const maxAttempts = Math.max(500, requestedCount * 250);

  for (let attempt = 0; attempt < maxAttempts && result.length < requestedCount; attempt += 1) {
    let generated;
    if (subject === "Mathematics") {
      const legacy = legacyMath.generateQuestions({ subject, topic, level: grade, difficulty, questionType: "Multiple Choice", count: 1 });
      generated = legacy && legacy[0];
    } else {
      generated = generateScienceQuestion({ grade, subject, topic, difficulty, family: randomItem(families) });
    }
    if (!generated) continue;
    generated = convertType(generated, request.questionType);
    const key = clean(generated.question);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: id(), subject, topic, grade, level: grade, difficulty,
      questionType: generated.questionType, question: generated.question,
      options: generated.options || [], answer: generated.answer,
      correctAnswer: generated.correctAnswer || generated.answer,
      explanation: generated.explanation || "Review the relevant concept and reasoning.",
      learningObjective: generated.learningObjective || `Apply ${topic}.`,
      questionFamily: generated.questionFamily || "generated",
    });
  }
  return result;
}

module.exports = { generateQuestions };
