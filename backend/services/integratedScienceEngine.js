/* =========================================================
   EduGen JHS INTEGRATED SCIENCE ENGINE
   ---------------------------------------------------------
   Dynamic, curriculum-gated question families.
   This module deliberately does not use a fixed question bank.

   Supported mode:
   - JHS1 / JHS2 / JHS3
   - Integrated Science

   The curriculumEngine remains the authority for whether a topic
   is valid for a grade. This file only generates questions for a
   validated topic.
========================================================= */

const crypto = require("crypto");

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomItem = (items) =>
  items[Math.floor(Math.random() * items.length)];

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const id = () => crypto.randomBytes(8).toString("hex");

const FAMILY_NAMES = [
  "concept",
  "application",
  "comparison",
  "cause-effect",
  "data-interpretation",
  "investigation",
  "misconception",
  "expert-reasoning",
];

const TOPIC_FAMILIES = {
  Matter: {
    concept: [
      ["Which statement best describes matter?", "Matter is anything that has mass and occupies space.", ["Matter is anything that produces light.", "Matter is only a solid substance.", "Matter has no mass."]],
      ["Which change is a physical change?", "Melting ice into liquid water.", ["Burning paper.", "Rusting iron.", "Cooking an egg."]],
    ],
    application: [
      ["A learner places an ice cube in a warm room. What change should be observed first?", "The ice changes from solid to liquid.", ["The ice changes directly to a new element.", "The mass of the water becomes zero.", "The water becomes a gas immediately."]],
    ],
    comparison: [
      ["Which comparison between solids and liquids is correct?", "Solids have a fixed shape while liquids take the shape of their container.", ["Both always have a fixed shape.", "Liquids cannot flow.", "Solids have no definite volume."]],
    ],
    "cause-effect": [
      ["Why does a liquid take the shape of its container?", "Its particles can move past one another.", ["Its particles have no mass.", "Its particles disappear.", "Its particles are completely fixed."]],
    ],
    investigation: [
      ["A learner wants to compare how quickly two liquids evaporate. Which variable should be kept the same?", "The volume of each liquid used at the start.", ["The identity of both liquids.", "The result before the experiment.", "The conclusion."]],
    ],
  },
  Energy: {
    concept: [
      ["Which statement best describes energy?", "Energy is the capacity to do work or cause change.", ["Energy is matter itself.", "Energy can never be transferred.", "Energy only exists in batteries."]],
      ["Which is a renewable source of energy?", "Sunlight.", ["Coal.", "Petroleum.", "Natural gas."]],
    ],
    application: [
      ["A solar panel is exposed to sunlight and powers a lamp. What energy conversion is mainly involved?", "Light energy is converted into electrical energy, then light energy.", ["Sound energy becomes mass.", "Chemical energy becomes coal.", "Heat becomes matter."]],
    ],
    comparison: [
      ["Which source is renewable?", "Wind energy.", ["Diesel.", "Coal.", "Petroleum."]],
    ],
    "cause-effect": [
      ["Why can an uncovered flame heat a nearby object?", "Energy is transferred from the hot flame to the object.", ["Heat creates matter.", "The object produces the flame.", "Energy cannot move between objects."]],
    ],
    investigation: [
      ["A learner investigates which material is the best thermal insulator. What should be measured?", "The change in temperature over a fixed period.", ["The learner's favourite material.", "The colour of the table only.", "The name of the classroom."]],
    ],
  },
  "Forces and Motion": {
    concept: [
      ["What is a force?", "A push or pull that can change motion or shape.", ["A type of matter.", "A colour of an object.", "A unit of temperature."]],
      ["Which quantity describes how fast an object moves?", "Speed.", ["Mass.", "Density.", "Temperature."]],
    ],
    application: [
      ["A cyclist travels 120 m in 20 s. What is the average speed?", "6 m/s.", ["2 m/s.", "20 m/s.", "140 m/s."]],
    ],
    comparison: [
      ["Two cars travel the same distance. Car A takes 10 s and Car B takes 20 s. Which car has the greater average speed?", "Car A.", ["Car B.", "They must have the same speed.", "Speed cannot be compared."]],
    ],
    "cause-effect": [
      ["Why does a moving ball eventually slow down on a rough surface?", "Friction opposes its motion.", ["Gravity stops existing.", "Its mass disappears.", "Friction creates forward motion."]],
    ],
    "data-interpretation": [
      ["A toy car travels 10 m in 5 s, then 20 m in 5 s. During which interval was its average speed greater?", "The second 5-second interval.", ["The first interval.", "Both were zero.", "They cannot be compared."]],
    ],
  },
  "Living Things": {
    concept: [
      ["Which characteristic is shared by all living organisms?", "They carry out life processes.", ["They all move from place to place.", "They all make their own food.", "They all have leaves."]],
    ],
    application: [
      ["A plant bends towards a light source. Which characteristic of living things does this demonstrate?", "Response to a stimulus.", ["Digestion only.", "Excretion only.", "Reproduction only."]],
    ],
    comparison: [
      ["Which feature distinguishes most plants from animals?", "Plants generally make their own food by photosynthesis.", ["Plants are made of matter but animals are not.", "Animals cannot respire.", "Plants cannot reproduce."]],
    ],
    "cause-effect": [
      ["Why do organisms need nutrients?", "Nutrients provide materials and energy needed for life processes.", ["Nutrients stop all life processes.", "Nutrients replace oxygen completely.", "Nutrients make organisms non-living."]],
    ],
  },
  Cells: {
    concept: [
      ["What is the basic structural unit of living organisms?", "The cell.", ["The tissue only.", "The organ only.", "The bone only."]],
      ["Which cell structure controls many activities of a typical plant or animal cell?", "The nucleus.", ["Cell wall.", "Vacuole only.", "Chlorophyll."]],
    ],
    comparison: [
      ["Which structure is found in plant cells but not typical animal cells?", "A cell wall.", ["A nucleus.", "Cytoplasm.", "A cell membrane."]],
    ],
    "cause-effect": [
      ["Why is the cell membrane important?", "It controls substances entering and leaving the cell.", ["It makes every cell green.", "It produces all food directly.", "It gives every animal a skeleton."]],
    ],
    investigation: [
      ["A learner observes cells using a microscope. Why is staining sometimes useful?", "It increases contrast so structures are easier to see.", ["It makes cells larger permanently.", "It turns cells into tissues.", "It removes the nucleus."]],
    ],
  },
  "Human Body": {
    concept: [
      ["Which organ pumps blood around the body?", "The heart.", ["The lungs.", "The stomach.", "The kidney."]],
      ["Where does most gas exchange in the lungs occur?", "The alveoli.", ["The oesophagus.", "The stomach.", "The bladder."]],
    ],
    application: [
      ["Why does breathing rate usually increase during vigorous exercise?", "Muscles need more oxygen and produce more carbon dioxide.", ["The body stops using energy.", "The lungs stop exchanging gases.", "The muscles need no oxygen."]],
    ],
    "cause-effect": [
      ["Why does the heart rate increase during exercise?", "More blood must be delivered to active tissues.", ["The blood stops moving.", "The muscles stop respiring.", "The heart becomes unnecessary."]],
    ],
  },
  Reproduction: {
    concept: [
      ["What is reproduction?", "The process by which organisms produce new individuals.", ["The process of digestion only.", "The movement of blood only.", "The removal of all cells."]],
    ],
    comparison: [
      ["Which statement best distinguishes sexual from asexual reproduction?", "Sexual reproduction usually involves genetic material from two parents.", ["Asexual reproduction always needs two parents.", "Sexual reproduction produces no variation.", "Asexual reproduction cannot occur in organisms."]],
    ],
    "cause-effect": [
      ["Why is variation important in a population?", "It can help populations respond to changing conditions.", ["It makes every organism identical.", "It prevents reproduction.", "It removes all inherited characteristics."]],
    ],
  },
  Ecology: {
    concept: [
      ["What is an ecosystem?", "A community of organisms interacting with one another and with their environment.", ["Only the animals in an area.", "Only the soil in an area.", "A single organism only."]],
    ],
    application: [
      ["In a simple food chain grass → grasshopper → frog, what is the grasshopper?", "A primary consumer.", ["A producer.", "A decomposer only.", "A secondary consumer."]],
    ],
    "cause-effect": [
      ["What may happen if a major predator is removed from a food web?", "The populations of some prey may increase and disturb the food web.", ["All organisms immediately disappear.", "Energy stops existing.", "Plants can no longer photosynthesise automatically."]],
    ],
    "data-interpretation": [
      ["A pond survey finds 40 producers, 15 herbivores and 5 carnivores. Which group has the largest recorded population?", "Producers.", ["Herbivores.", "Carnivores.", "All groups are equal."]],
    ],
  },
  "Earth and Space": {
    concept: [
      ["Which object is a star?", "The Sun.", ["The Moon.", "Earth.", "Mars."]],
      ["What mainly causes day and night on Earth?", "Earth's rotation on its axis.", ["Earth's revolution around the Moon.", "The Moon producing sunlight.", "Clouds moving around Earth."]],
    ],
    comparison: [
      ["Which statement correctly compares a planet and a star?", "A star produces its own light, while a planet reflects light from a star.", ["Both must produce their own light.", "Planets are always larger than stars.", "Stars orbit only the Moon."]],
    ],
  },
  Health: {
    concept: [
      ["Which practice helps reduce the spread of many infectious diseases?", "Regular handwashing with soap and clean water.", ["Sharing used needles.", "Ignoring sanitation.", "Drinking contaminated water."]],
    ],
    application: [
      ["Why is safe drinking water important?", "It reduces exposure to disease-causing organisms and harmful substances.", ["It guarantees that nobody can ever become ill.", "It removes the need for food.", "It prevents all injuries."]],
    ],
    "cause-effect": [
      ["Why can poor sanitation increase disease transmission?", "It can allow pathogens to contaminate water, food or surroundings.", ["It destroys every pathogen automatically.", "It stops all human contact.", "It removes the need for hygiene."]],
    ],
  },
};

function difficultyWeight(difficulty) {
  if (difficulty === "Expert") return 3;
  if (difficulty === "Hard") return 2;
  if (difficulty === "Medium") return 1;
  return 0;
}

function selectFamily(topic, difficulty, usedFamilies = new Set()) {
  const families = TOPIC_FAMILIES[topic] || {};
  let candidates = Object.keys(families).filter((family) => !usedFamilies.has(family));

  if (!candidates.length) candidates = Object.keys(families);
  if (!candidates.length) return null;

  if (difficultyWeight(difficulty) >= 2) {
    const reasoningFamilies = ["data-interpretation", "investigation", "cause-effect", "application", "misconception", "expert-reasoning"];
    const preferred = candidates.filter((family) => reasoningFamilies.includes(family));
    if (preferred.length) candidates = preferred;
  }

  return randomItem(candidates);
}

function createDistractors(answer, distractors) {
  return shuffle([answer, ...distractors].slice(0, 4));
}

function buildQuestion({ grade, topic, difficulty, family, row }) {
  const [question, answer, distractors] = row;
  const options = createDistractors(answer, distractors);

  return {
    id: id(),
    question,
    options,
    answer,
    correctAnswer: answer,
    questionType: "Multiple Choice",
    subject: "Integrated Science",
    grade,
    level: grade,
    topic,
    difficulty,
    questionFamily: family,
    explanation: `The correct answer is ${answer}.`,
    learningObjective: `Apply understanding of ${topic.toLowerCase()} to a ${family.replace(/-/g, " ")} question.`,
  };
}

function generateIntegratedScienceQuestion({ grade = "JHS1", topic, difficulty = "Medium", family, usedFamilies }) {
  const families = TOPIC_FAMILIES[topic];
  if (!families) return null;

  const selectedFamily = family || selectFamily(topic, difficulty, usedFamilies);
  if (!selectedFamily || !families[selectedFamily]) return null;

  const row = randomItem(families[selectedFamily]);
  return buildQuestion({ grade, topic, difficulty, family: selectedFamily, row });
}

function generateIntegratedScienceQuestions({ grade = "JHS1", topic, difficulty = "Medium", count = 1 }) {
  const questions = [];
  const seen = new Set();
  const usedFamilies = new Set();
  const maxAttempts = Math.max(count * 30, 60);

  for (let attempt = 0; attempt < maxAttempts && questions.length < count; attempt += 1) {
    const question = generateIntegratedScienceQuestion({
      grade,
      topic,
      difficulty,
      usedFamilies,
    });

    if (!question) break;

    const key = question.question.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;

    seen.add(key);
    usedFamilies.add(question.questionFamily);
    questions.push(question);
  }

  return questions;
}

module.exports = {
  FAMILY_NAMES,
  TOPIC_FAMILIES,
  generateIntegratedScienceQuestion,
  generateIntegratedScienceQuestions,
};
