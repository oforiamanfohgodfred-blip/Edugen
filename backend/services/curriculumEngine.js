/* =========================================================
   EduGen Ghana Curriculum Engine
   ---------------------------------------------------------
   JHS1-JHS3: Mathematics + Integrated Science
   SHS1-SHS3: Mathematics + Physics + Chemistry + Biology
   University is intentionally unsupported.
========================================================= */

const CURRICULUM_SOURCES = {
  JHS_MATHEMATICS: "NaCCA JHS Mathematics Curriculum",
  JHS_SCIENCE: "NaCCA JHS Science Curriculum",
  SHS_MATHEMATICS: "NaCCA SHS Mathematics Curriculum",
  SHS_PHYSICS: "NaCCA SHS Physics Curriculum",
  SHS_CHEMISTRY: "NaCCA SHS Chemistry Curriculum",
  SHS_BIOLOGY: "NaCCA SHS Biology Curriculum",
};

const GRADE_ALIASES = {
  JHS1: "JHS1", JHS2: "JHS2", JHS3: "JHS3",
  B7: "JHS1", B8: "JHS2", B9: "JHS3",
  "JHS 1": "JHS1", "JHS 2": "JHS2", "JHS 3": "JHS3",
  SHS1: "SHS1", SHS2: "SHS2", SHS3: "SHS3",
  B10: "SHS1", B11: "SHS2", B12: "SHS3",
  "SHS 1": "SHS1", "SHS 2": "SHS2", "SHS 3": "SHS3",
};

const SUBJECT_ALIASES = {
  math: "Mathematics", maths: "Mathematics", mathematics: "Mathematics",
  "core mathematics": "Mathematics", science: "Integrated Science",
  "integrated science": "Integrated Science", biology: "Biology",
  physics: "Physics", chemistry: "Chemistry",
};

const CURRICULUM = {
  JHS1: {
    Mathematics: { source: "JHS_MATHEMATICS", topics: [
      "Whole Numbers and Place Value", "Fractions", "Decimals", "Percentages",
      "Ratio", "Basic Algebraic Expressions", "Simple Linear Equations",
      "Lines and Angles", "Plane Shapes", "Measurement", "Data Collection and Representation",
      "Basic Probability"
    ]},
    "Integrated Science": { source: "JHS_SCIENCE", topics: [
      "Materials and Their Properties", "Living and Non-Living Things", "Cells and Simple Organisation",
      "Human Health and Nutrition", "Plants and Their Functions", "Matter and Changes of State",
      "Energy Forms and Sources", "Forces and Simple Machines", "The Solar System",
      "Water and Air", "Environment and Sanitation"
    ]},
  },
  JHS2: {
    Mathematics: { source: "JHS_MATHEMATICS", topics: [
      "Integers and Rational Numbers", "Fractions and Percentages", "Ratio and Proportion",
      "Indices", "Algebraic Expressions", "Linear Equations", "Sequences and Patterns",
      "Angles and Polygons", "Transformations", "Perimeter Area and Volume",
      "Statistics", "Probability"
    ]},
    "Integrated Science": { source: "JHS_SCIENCE", topics: [
      "Particle Nature of Matter", "Mixtures and Separation", "Chemical Changes",
      "Cell Structure and Functions", "Reproduction in Plants and Animals", "Human Body Systems",
      "Food and Digestion", "Heat and Temperature", "Light and Sound", "Electricity",
      "Forces and Motion", "Ecology and Food Chains"
    ]},
  },
  JHS3: {
    Mathematics: { source: "JHS_MATHEMATICS", topics: [
      "Number Bases and Numeration", "Standard Form and Approximation", "Indices and Surds",
      "Percentages and Financial Mathematics", "Direct and Inverse Proportion", "Linear and Simultaneous Equations",
      "Sequences and Relations", "Pythagoras and Right Triangles", "Bearings and Scale Drawing",
      "Circles and Solid Shapes", "Statistics and Data Interpretation", "Probability"
    ]},
    "Integrated Science": { source: "JHS_SCIENCE", topics: [
      "Atomic Structure and Elements", "Chemical Reactions", "Acids Bases and Salts",
      "Cells and Organisation", "Inheritance and Variation", "Human Reproductive Health",
      "Respiration and Excretion", "Force Work and Energy", "Electricity and Electromagnetism",
      "Waves and Sound", "Earth Resources and Climate", "Ecosystems and Conservation"
    ]},
  },
  SHS1: {
    Mathematics: { source: "SHS_MATHEMATICS", topics: [
      "Real Numbers", "Surds and Indices", "Logarithms", "Sets", "Functions and Relations",
      "Algebraic Expressions and Equations", "Sequences and Series", "Coordinate Geometry",
      "Mensuration", "Vectors", "Descriptive Statistics", "Probability"
    ]},
    Physics: { source: "SHS_PHYSICS", topics: [
      "Physical Quantities and Measurement", "Vectors and Scalars", "Kinematics", "Dynamics",
      "Work Energy and Power", "Circular Motion", "Properties of Matter", "Heat and Temperature"
    ]},
    Chemistry: { source: "SHS_CHEMISTRY", topics: [
      "Matter and Measurement", "Atomic Structure", "Periodic Table", "Chemical Bonding",
      "Mole Concept and Stoichiometry", "Chemical Equations", "States of Matter", "Energetics"
    ]},
    Biology: { source: "SHS_BIOLOGY", topics: [
      "Biology as a Science", "Cell Structure and Function", "Biological Molecules", "Enzymes",
      "Nutrition", "Transport in Plants", "Transport in Animals", "Ecology", "Classification"
    ]},
  },
  SHS2: {
    Mathematics: { source: "SHS_MATHEMATICS", topics: [
      "Algebraic Fractions", "Quadratic Equations", "Inequalities", "Binomial Expansion",
      "Arithmetic and Geometric Progressions", "Trigonometry", "Matrices", "Vectors",
      "Coordinate Geometry", "Statistics", "Probability Distributions"
    ]},
    Physics: { source: "SHS_PHYSICS", topics: [
      "Momentum and Collisions", "Gravitation", "Simple Harmonic Motion", "Waves",
      "Sound", "Optics", "Electric Fields", "Current Electricity", "DC Circuits"
    ]},
    Chemistry: { source: "SHS_CHEMISTRY", topics: [
      "Solutions", "Acids Bases and pH", "Redox Reactions", "Electrochemistry",
      "Chemical Kinetics", "Chemical Equilibrium", "Organic Chemistry", "Hydrocarbons"
    ]},
    Biology: { source: "SHS_BIOLOGY", topics: [
      "Cell Division", "Genetics and Inheritance", "Evolution", "Homeostasis", "Excretion",
      "Coordination and Response", "Reproduction", "Plant Growth", "Ecology and Population"
    ]},
  },
  SHS3: {
    Mathematics: { source: "SHS_MATHEMATICS", topics: [
      "Advanced Functions", "Differentiation", "Applications of Differentiation", "Integration",
      "Applications of Integration", "Advanced Trigonometry", "Complex Numbers",
      "Permutations and Combinations", "Advanced Probability", "Statistical Inference"
    ]},
    Physics: { source: "SHS_PHYSICS", topics: [
      "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Modern Physics",
      "Atomic Physics", "Nuclear Physics", "Semiconductors", "Electronics", "Energy and Society"
    ]},
    Chemistry: { source: "SHS_CHEMISTRY", topics: [
      "Advanced Organic Chemistry", "Alcohols and Carboxylic Acids", "Polymers", "Aromatic Compounds",
      "Chemical Equilibrium", "Solubility Equilibria", "Thermodynamics", "Industrial Chemistry"
    ]},
    Biology: { source: "SHS_BIOLOGY", topics: [
      "Advanced Genetics", "Gene Expression", "Biotechnology", "Immunity and Disease",
      "Mammalian Physiology", "Plant Physiology", "Population Ecology", "Conservation Biology",
      "Applied Biology"
    ]},
  },
};

function normalizeGrade(value) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim().replace(/_/g, " ");
  return GRADE_ALIASES[raw] || GRADE_ALIASES[raw.toUpperCase()] || null;
}

function normalizeSubject(value) {
  if (value === undefined || value === null) return null;
  return SUBJECT_ALIASES[String(value).trim().toLowerCase()] || null;
}

function normalizeTopic(value) {
  if (value === undefined || value === null) return null;
  return String(value).trim().replace(/\s+/g, " ");
}

function getCurriculum(grade) {
  const g = normalizeGrade(grade);
  return g ? CURRICULUM[g] || null : null;
}

function getSubjectsForGrade(grade) {
  const c = getCurriculum(grade);
  return c ? Object.keys(c) : [];
}

function getTopicsForSubject(grade, subject) {
  const g = normalizeGrade(grade);
  const s = normalizeSubject(subject);
  return g && s && CURRICULUM[g]?.[s] ? CURRICULUM[g][s].topics.slice() : [];
}

function resolveTopic(grade, subject, topic) {
  const topics = getTopicsForSubject(grade, subject);
  if (!topic) return null;
  const target = normalizeTopic(topic).toLowerCase();
  return topics.find((t) => t.toLowerCase() === target) || null;
}

function validateRequest({ grade, subject, topic }) {
  const g = normalizeGrade(grade);
  const s = normalizeSubject(subject);

  if (!g) return { valid: false, code: "INVALID_GRADE", message: "Unsupported or missing grade." };
  if (!s || !CURRICULUM[g]?.[s]) {
    return { valid: false, code: "INVALID_SUBJECT", message: `${subject || "This subject"} is not available for ${g}.`, grade: g, availableSubjects: getSubjectsForGrade(g) };
  }

  const t = resolveTopic(g, s, topic);
  if (!t) {
    return { valid: false, code: "INVALID_TOPIC", message: `${topic || "This topic"} is not configured for ${g} ${s}.`, grade: g, subject: s, availableTopics: getTopicsForSubject(g, s) };
  }

  return { valid: true, grade: g, academicLevel: g.startsWith("JHS") ? "JHS" : "SHS", subject: s, topic: t, source: CURRICULUM[g][s].source };
}

module.exports = {
  CURRICULUM,
  CURRICULUM_SOURCES,
  normalizeGrade,
  normalizeSubject,
  normalizeTopic,
  getCurriculum,
  getSubjectsForGrade,
  getTopicsForSubject,
  resolveTopic,
  validateRequest,
};
