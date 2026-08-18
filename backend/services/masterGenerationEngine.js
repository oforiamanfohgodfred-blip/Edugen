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
   - Topic adapters prevent curriculum/generator mismatches
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
  "Matter and Measurement": [["Which measurement is most directly associated with the amount of matter in a sample?", "Mass", ["Colour", "Temperature", "Volume only"]]],
  "Atomic Structure": [["What determines the atomic number of an element?", "The number of protons", ["The number of neutrons", "The number of shells", "The number of molecules"]], ["An atom with 11 protons and 10 electrons has what charge?", "+1", ["-1", "0", "+10"]]],
  "Periodic Table": [["Elements in the same group of the periodic table generally have similar...", "chemical properties", ["mass numbers only", "neutron counts only", "physical states at every temperature"]]],
  "Chemical Bonding": [["What type of bonding involves transfer of electrons between atoms?", "Ionic bonding", ["Covalent bonding", "Metallic bonding", "Hydrogen bonding"]], ["A covalent bond is formed when atoms...", "share electrons", ["destroy protons", "share neutrons", "lose their nuclei"]]],
  "Mole Concept and Stoichiometry": [["What does a balanced chemical equation conserve?", "The number of atoms of each element", ["The number of molecules on each side", "The temperature", "The colour of the reactants"]]],
  "Chemical Equations": [["Why must a chemical equation be balanced?", "Atoms are conserved during a chemical reaction", ["Mass disappears", "Products have no atoms", "Temperature must be equal"]]],
  "States of Matter": [["Which state has particles that are relatively close together but able to flow past one another?", "Liquid", ["Solid", "Gas", "Vacuum"]]],
  Energetics: [["An exothermic reaction generally...", "releases energy to the surroundings", ["absorbs all energy", "creates matter", "stops particle motion"]]],
  Solutions: [["What is a solution?", "A homogeneous mixture in which a solute is dispersed in a solvent", ["A pure element", "A single atom", "An insoluble solid only"]]],
  "Acids Bases and pH": [["A solution with pH 3 is...", "acidic", ["neutral", "alkaline", "always concentrated"]]],
  "Redox Reactions": [["Oxidation can be described as...", "loss of electrons", ["gain of electrons only", "loss of neutrons", "formation of water only"]]],
  Electrochemistry: [["What converts chemical energy directly into electrical energy in a galvanic cell?", "A spontaneous redox reaction", ["Only heating", "Mechanical compression", "Sound waves"]]],
  "Chemical Kinetics": [["A catalyst increases reaction rate mainly by...", "providing an alternative pathway with lower activation energy", ["increasing product mass", "changing atomic numbers", "removing all reactants"]]],
  "Chemical Equilibrium": [["At dynamic equilibrium in a closed system...", "forward and reverse reaction rates are equal", ["both reactions stop", "only products remain", "temperature must be zero"]]],
  "Organic Chemistry": [["Which element is essential in all organic compounds?", "Carbon", ["Sodium", "Iron", "Calcium"]]],
  Hydrocarbons: [["Which class of hydrocarbons contains at least one carbon-carbon double bond?", "Alkenes", ["Alkanes", "Noble gases", "Salts"]]],
  "Advanced Organic Chemistry": [["What is an important feature of organic chemistry?", "The chemistry of carbon compounds", ["Only metals", "Only noble gases", "Only water"]]],
  "Alcohols and Carboxylic Acids": [["Which functional group characterizes alcohols?", "Hydroxyl group", ["Carboxyl group", "Amino group only", "Carbonyl-free group"]]],
  Polymers: [["A polymer is generally...", "a large molecule made from repeating smaller units", ["a single proton", "a pure metal", "a simple ion only"]]],
  "Aromatic Compounds": [["Which ring system is characteristic of benzene?", "A six-carbon aromatic ring", ["A four-carbon square", "A two-oxygen ring", "A metal lattice"]]],
  "Solubility Equilibria": [["What does solubility describe?", "The maximum amount of solute that dissolves under specified conditions", ["The atomic number", "The melting point only", "The density of a gas only"]]],
  Thermodynamics: [["Which quantity represents energy transfer associated with temperature difference?", "Heat", ["Atomic number", "Molecular formula", "Charge only"]]],
  "Industrial Chemistry": [["Why are catalysts useful in many industrial processes?", "They can increase reaction rate and reduce energy requirements", ["They create atoms", "They stop all reactions", "They eliminate products"]]],
};

const biologyConcepts = {
  "Biology as a Science": [["Why is controlled observation important in biology?", "It provides evidence that can be analysed and tested", ["It guarantees every hypothesis is true", "It replaces measurement", "It prevents new questions"]]],
  "Biology as the Science of Life": [["Which characteristic of living things involves removal of metabolic waste?", "Excretion", ["Nutrition", "Reproduction", "Sensitivity"]]],
  "Cell Structure and Function": [["Which organelle is mainly associated with aerobic respiration?", "Mitochondrion", ["Ribosome", "Cell wall", "Vacuole"]]],
  "Cell Structure and Functions": [["Which structure contains genetic material in a typical eukaryotic cell?", "Nucleus", ["Cell wall", "Cell membrane", "Golgi apparatus"]]],
  "Biological Molecules": [["Which type of molecule commonly serves as a major immediate energy source?", "Carbohydrate", ["Nucleic acid only", "Mineral salt", "Water only"]]],
  Enzymes: [["Why are enzymes important in cells?", "They catalyse biochemical reactions", ["They replace oxygen", "They store all genetic information", "They form bones only"]]],
  Nutrition: [["Which nutrient is mainly required for growth and tissue repair?", "Protein", ["Fibre only", "Water only", "Mineral salts only"]]],
  "Transport in Plants": [["Which tissue transports water and mineral salts upward in a plant?", "Xylem", ["Phloem", "Epidermis", "Stoma"]]],
  "Transport in Animals": [["Which blood vessel carries blood away from the heart?", "Artery", ["Vein", "Capillary", "Alveolus"]]],
  Ecology: [["What is a producer in a food chain?", "An organism that makes its own food", ["An organism that eats only meat", "A decomposer", "A parasite only"]]],
  Classification: [["Why are organisms classified?", "To organise them according to shared characteristics", ["To change their DNA", "To make all organisms identical", "To remove variation"]]],
  "Cell Division": [["What is the main outcome of mitosis in a typical body cell?", "Two genetically similar daughter cells", ["Four unrelated cells", "One cell with no DNA", "Only gametes"]]],
  "Genetics and Inheritance": [["What carries inherited information?", "Genes", ["Digestive enzymes", "Red blood cells", "Starch grains"]]],
  Evolution: [["Natural selection can change populations because individuals...", "with advantageous inherited traits may leave more offspring", ["all have identical traits", "never reproduce", "change traits only by choice"]]],
  Homeostasis: [["Homeostasis is the maintenance of...", "a relatively stable internal environment", ["constant body size only", "one fixed temperature everywhere", "external weather conditions"]]],
  Excretion: [["Which organ removes urea from the blood in humans?", "Kidneys", ["Lungs only", "Stomach", "Pancreas"]]],
  "Coordination and Response": [["Which system rapidly transmits electrical signals around the body?", "Nervous system", ["Digestive system", "Skeletal system", "Excretory system"]]],
  Reproduction: [["Which process produces offspring?", "Reproduction", ["Respiration", "Excretion", "Digestion"]]],
  "Plant Growth": [["Which plant hormone is strongly associated with cell elongation?", "Auxin", ["Insulin", "Adrenaline", "Haemoglobin"]]],
  "Ecology and Population": [["A population is best described as...", "members of the same species living in an area at a given time", ["all ecosystems on Earth", "all different species everywhere", "only non-living factors"]]],
  "Advanced Genetics": [["What is a mutation?", "A change in genetic material", ["A change in weather", "A temporary change in temperature", "A change in food colour only"]]],
  "Gene Expression": [["Gene expression refers to the process by which information in genes contributes to...", "functional products such as proteins", ["the formation of rocks", "weather changes", "only water movement"]]],
  Biotechnology: [["What is biotechnology?", "The use of biological systems or organisms to develop useful products or processes", ["The study of stars only", "The manufacture of metals only", "The measurement of rainfall only"]]],
  "Immunity and Disease": [["What is a major role of the immune system?", "Defending the body against pathogens and abnormal cells", ["Digesting all food", "Pumping blood", "Producing sunlight"]]],
  "Mammalian Physiology": [["Which organ pumps blood around the mammalian body?", "Heart", ["Lung", "Kidney", "Stomach"]]],
  "Plant Physiology": [["What is photosynthesis?", "A process by which plants use light energy to make organic food", ["A form of digestion", "A method of blood circulation", "A type of excretion"]]],
  "Population Ecology": [["Which factor can limit population growth?", "Availability of resources", ["Unlimited food", "Unlimited space", "No competition"]]],
  "Conservation Biology": [["Why is biodiversity conservation important?", "It protects biological variety and ecosystem functions", ["It eliminates every species", "It stops all natural change", "It prevents all competition"]]],
  "Applied Biology": [["Applied biology uses biological knowledge to...", "solve practical problems", ["avoid evidence", "eliminate experiments", "replace all scientific measurement"]]],
};

function baseConcept(subject, grade, topic, difficulty, family) {
  const bank = subject === "Chemistry" ? chemistryConcepts[topic] : biologyConcepts[topic];
  if (!bank || !bank.length) return genericScienceConcept(subject, grade, topic, difficulty, family);
  const [question, answer, distractors] = randomItem(bank);
  return { id: id(), subject, grade, level: grade, topic, difficulty, questionFamily: family, question, options: [answer, ...distractors].sort(() => Math.random() - 0.5), answer, correctAnswer: answer, questionType: "Multiple Choice", explanation: `The correct answer is ${answer}.`, learningObjective: `Apply knowledge of ${topic}.` };
}

function genericScienceConcept(subject, grade, topic, difficulty, family) {
  const prompts = subject === "Chemistry" ? [
    `Which statement best describes the central idea of ${topic}?`,
    `Which approach is most scientifically appropriate when studying ${topic}?`,
  ] : [
    `Which statement best describes the central idea of ${topic}?`,
    `Which evidence would be most useful when investigating ${topic}?`,
  ];
  const question = randomItem(prompts);
  const answer = `Use the relevant principles, evidence and relationships of ${topic} to explain the observed result.`;
  return { id: id(), subject, grade, level: grade, topic, difficulty, questionFamily: family, question, options: [answer, "Ignore the evidence and rely only on an assumption.", "Change several variables and record no measurements.", "Treat every observation as unrelated to the topic."], answer, correctAnswer: answer, questionType: "Multiple Choice", explanation: `A scientifically sound response to ${topic} uses relevant principles and evidence.`, learningObjective: `Explain and apply principles of ${topic}.` };
}

function chemistryCalculation(grade, topic, difficulty) {
  if (topic === "Mole Concept and Stoichiometry") {
    const mol = randomInt(2, difficulty === "Expert" ? 40 : 15), mass = mol * 18;
    return { id: id(), subject: "Chemistry", grade, level: grade, topic, difficulty, questionFamily: "calculation", question: `How many grams are present in ${mol} mol of a substance with molar mass 18 g/mol?`, options: [`${mass} g`, `${mol + 18} g`, `${mol * 2} g`, `${Math.max(1, mass - 18)} g`], answer: `${mass} g`, correctAnswer: `${mass} g`, questionType: "Multiple Choice", explanation: `Mass = amount × molar mass = ${mol} × 18 = ${mass} g.`, learningObjective: "Use mole relationships and molar mass." };
  }
  if (topic === "Acids Bases and pH") {
    const pH = randomInt(1, 13), classification = pH < 7 ? "acidic" : pH === 7 ? "neutral" : "alkaline";
    return { id: id(), subject: "Chemistry", grade, level: grade, topic, difficulty, questionFamily: "application", question: `A solution has pH ${pH}. How should it be classified?`, options: [classification, classification === "acidic" ? "alkaline" : "acidic", "always concentrated", "always dilute"], answer: classification, correctAnswer: classification, questionType: "Multiple Choice", explanation: "pH below 7 is acidic, 7 is neutral, and above 7 is alkaline.", learningObjective: "Classify aqueous solutions using the pH scale." };
  }
  return null;
}

function biologyApplication(grade, topic, difficulty) {
  if (topic === "Ecology" || topic === "Ecology and Population" || topic === "Population Ecology") {
    const a = randomInt(8, difficulty === "Expert" ? 80 : 30), b = randomInt(3, Math.max(4, a));
    const d = gcd(a, b), ratio = `${a / d}:${b / d}`;
    return { id: id(), subject: "Biology", grade, level: grade, topic, difficulty, questionFamily: "data-interpretation", question: `A habitat survey records ${a} organisms in one group and ${b} in another. What is the ratio in simplest form?`, options: [ratio, `${b}:${a}`, `${a + b}:1`, `1:${a + b}`], answer: ratio, correctAnswer: ratio, questionType: "Multiple Choice", explanation: `Divide both terms of ${a}:${b} by their greatest common divisor, ${d}.", learningObjective: "Interpret quantitative biological data." };
  }
  return null;
}
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }

const PHYSICS_ALIASES = {
  "Physical Quantities and Measurement": "Mechanics", "Vectors and Scalars": "Mechanics", Kinematics: "Mechanics", Dynamics: "Mechanics",
  "Work Energy and Power": "Work, Energy and Power", "Circular Motion": "Mechanics", "Properties of Matter": "Mechanics", "Heat and Temperature": "Work, Energy and Power",
  "Momentum and Collisions": "Mechanics", Gravitation: "Mechanics", "Simple Harmonic Motion": "Waves", Waves: "Waves", Sound: "Waves", Optics: "Waves",
  "Electric Fields": "Electricity", "Current Electricity": "Electricity", "DC Circuits": "Electricity", "Electromagnetic Induction": "Electricity", "Alternating Current": "Electricity",
  "Electromagnetic Waves": "Waves", "Modern Physics": "Waves", "Atomic Physics": "Waves", "Nuclear Physics": "Mechanics", Semiconductors: "Electricity", Electronics: "Electricity", "Energy and Society": "Work, Energy and Power",
};

function generatePhysicsQuestion({ grade, topic, difficulty, family }) {
  const mappedTopic = PHYSICS_ALIASES[topic] || topic;
  const generated = generateSHSPhysicsQuestion({ grade, topic: mappedTopic, difficulty, family });
  if (!generated) return genericPhysicsConcept(grade, topic, difficulty, family);
  return { ...generated, topic, learningObjective: `Apply ${topic.toLowerCase()} principles in a ${family.replace(/-/g, " ")} context.` };
}
function genericPhysicsConcept(grade, topic, difficulty, family) {
  const q = `Which statement is most scientifically appropriate when analysing ${topic}?`;
  const answer = `Use the relevant physical quantities, relationships, measurements and evidence associated with ${topic}.`;
  return { id: id(), subject: "Physics", grade, level: grade, topic, difficulty, questionFamily: family, question: q, options: [answer, "Ignore units and measurements.", "Assume all quantities are unrelated.", "Use an answer without checking physical consistency."], answer, correctAnswer: answer, questionType: "Multiple Choice", explanation: `Physics problems involving ${topic} should be analysed using appropriate physical laws, quantities, units and evidence.`, learningObjective: `Analyse and apply principles of ${topic}.` };
}

function generateScienceQuestion({ grade, subject, topic, difficulty, family }) {
  if (grade.startsWith("JHS") && subject === "Integrated Science") return generateJHSIntegratedScienceQuestion({ grade, topic, difficulty, family });
  if (subject === "Physics") return generatePhysicsQuestion({ grade, topic, difficulty, family });
  if (subject === "Chemistry") return chemistryCalculation(grade, topic, difficulty) || baseConcept(subject, grade, topic, difficulty, family);
  if (subject === "Biology") return biologyApplication(grade, topic, difficulty) || baseConcept(subject, grade, topic, difficulty, family);
  return null;
}

function convertType(question, requestedType) {
  const type = String(requestedType || "Multiple Choice").toLowerCase(), answer = String(question.answer);
  if (type.includes("true") || type.includes("false")) { const makeTrue = Math.random() > 0.5, falseAnswer = question.options && question.options.find((x) => String(x) !== answer) || "an incorrect result"; return { ...question, question: `True or False?\n\n${question.question}\n\nThe correct answer is ${makeTrue ? answer : falseAnswer}.`, options: ["True", "False"], answer: makeTrue ? "True" : "False", questionType: "True / False", explanation: makeTrue ? question.explanation : `${question.explanation} The proposed answer is incorrect; the correct answer is ${answer}.` }; }
  if (type.includes("fill")) return { ...question, question: question.question.replace(/[.!?]+$/, "") + ".\n\nFill in the blank: __________", options: [], questionType: "Fill in the Blank" };
  if (type.includes("short")) return { ...question, options: [], questionType: "Short Answer" };
  if (type.includes("problem") && !type.includes("word")) return { ...question, options: [], questionType: "Problem Solving", question: `PROBLEM SOLVING\n\n${question.question}\n\nGive only the final answer.` };
  if (type.includes("word")) return { ...question, options: [], questionType: "Word Problems", question: `REAL-WORLD PROBLEM\n\n${question.question}\n\nDetermine the required answer.` };
  return { ...question, questionType: "Multiple Choice" };
}

function generateQuestions(request) {
  const grade = curriculum.normalizeGrade(request.grade || request.level);
  const validation = curriculum.validateRequest({ grade, subject: request.subject, topic: request.topic });
  if (!validation.valid) { const error = new Error(validation.message); error.code = validation.code; error.details = validation; throw error; }
  const subject = validation.subject, topic = validation.topic, difficulty = request.difficulty || "Medium";
  const requestedCount = Math.min(Math.max(parseInt(request.count, 10) || 5, 1), 50);
  const result = [], seen = new Set();
  const families = ["concept", "application", "calculation", "comparison", "cause-effect", "data-interpretation", "investigation", "misconception", "expert-reasoning"];
  const maxAttempts = Math.max(1000, requestedCount * 300);
  for (let attempt = 0; attempt < maxAttempts && result.length < requestedCount; attempt += 1) {
    let generated;
    if (subject === "Mathematics") { const legacy = legacyMath.generateQuestions({ subject, topic, level: grade, difficulty, questionType: "Multiple Choice", count: 1 }); generated = legacy && legacy[0]; }
    else generated = generateScienceQuestion({ grade, subject, topic, difficulty, family: randomItem(families) });
    if (!generated) continue;
    generated = convertType(generated, request.questionType);
    const key = clean(generated.question);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ id: id(), subject, topic, grade, level: grade, difficulty, questionType: generated.questionType, question: generated.question, options: generated.options || [], answer: generated.answer, correctAnswer: generated.correctAnswer || generated.answer, explanation: generated.explanation || "Review the relevant concept and reasoning.", learningObjective: generated.learningObjective || `Apply ${topic}.`, questionFamily: generated.questionFamily || "generated" });
  }
  return result;
}

module.exports = { generateQuestions };