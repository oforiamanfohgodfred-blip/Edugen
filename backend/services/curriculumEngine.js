/* =========================================================
   EduGen Ghana Curriculum Engine
   ---------------------------------------------------------
   Scope:
   - JHS1-JHS3: Mathematics, Integrated Science
   - SHS1-SHS3: Mathematics, Physics, Chemistry, Biology

   This file is the single gatekeeper for grade/subject/topic
   validity. Question generation must not silently fall back to
   an unrelated topic.

   Curriculum source: Ghana NaCCA official curriculum documents.
========================================================= */

const CURRICULUM_SOURCES = {
  JHS_MATHEMATICS:
    "https://nacca.gov.gh/wp-content/uploads/2023/06/MATHEMATICS.pdf",
  JHS_SCIENCE:
    "https://nacca.gov.gh/wp-content/uploads/2022/10/Science-Curriculum.pdf",
  SHS_MATHEMATICS:
    "https://nacca.gov.gh/wp-content/uploads/2025/04/Mathematics-Curriculum.pdf",
  SHS_PHYSICS:
    "https://nacca.gov.gh/wp-content/uploads/2025/04/Physics-Curriculum.pdf",
  SHS_BIOLOGY:
    "https://nacca.gov.gh/wp-content/uploads/2025/04/Biology-Curriculum.pdf",
  SHS_CHEMISTRY:
    "https://nacca.gov.gh/secondary-education-curriculum/",
};

const GRADE_ALIASES = {
  JHS1: "JHS1",
  JHS2: "JHS2",
  JHS3: "JHS3",
  B7: "JHS1",
  B8: "JHS2",
  B9: "JHS3",
  "JHS 1": "JHS1",
  "JHS 2": "JHS2",
  "JHS 3": "JHS3",
  SHS1: "SHS1",
  SHS2: "SHS2",
  SHS3: "SHS3",
  B10: "SHS1",
  B11: "SHS2",
  B12: "SHS3",
  "SHS 1": "SHS1",
  "SHS 2": "SHS2",
  "SHS 3": "SHS3",
};

const SUBJECT_ALIASES = {
  math: "Mathematics",
  maths: "Mathematics",
  mathematics: "Mathematics",
  "core mathematics": "Mathematics",
  science: "Integrated Science",
  "integrated science": "Integrated Science",
  biology: "Biology",
  physics: "Physics",
  chemistry: "Chemistry",
};

// These are curriculum-level topic labels. They are intentionally
// normalized so generators can map aliases to the same topic key.
const CURRICULUM = {
  JHS1: {
    Mathematics: {
      source: "JHS_MATHEMATICS",
      topics: [
        "Number and Numeration Systems",
        "Number Operations",
        "Fractions, Decimals and Percentages",
        "Ratios and Proportion",
        "Patterns and Relations",
        "Algebraic Expressions",
        "Variables and Equations",
        "Shape and Space",
        "Measurement",
        "Position and Transformation",
        "Data",
        "Chance or Probability",
      ],
    },
    "Integrated Science": {
      source: "JHS_SCIENCE",
      topics: [
        "Matter",
        "Energy",
        "Forces and Motion",
        "Living Things",
        "Cells",
        "Human Body",
        "Reproduction",
        "Ecology",
        "Earth and Space",
        "Health",
      ],
    },
  },
  JHS2: {
    Mathematics: {
      source: "JHS_MATHEMATICS",
      topics: [
        "Number and Numeration Systems",
        "Number Operations",
        "Fractions, Decimals and Percentages",
        "Ratios and Proportion",
        "Patterns and Relations",
        "Algebraic Expressions",
        "Variables and Equations",
        "Shapes and Space",
        "Measurement",
        "Position and Transformation",
        "Data",
        "Chance or Probability",
      ],
    },
    "Integrated Science": {
      source: "JHS_SCIENCE",
      topics: [
        "Matter",
        "Energy",
        "Forces and Motion",
        "Living Things",
        "Cells",
        "Human Body",
        "Reproduction",
        "Ecology",
        "Earth and Space",
        "Health",
      ],
    },
  },
  JHS3: {
    Mathematics: {
      source: "JHS_MATHEMATICS",
      topics: [
        "Number and Numeration System",
        "Number Operations",
        "Fractions, Decimals and Percentages",
        "Ratios and Proportion",
        "Patterns and Relations",
        "Algebraic Expressions",
        "Variables and Equations",
        "Shapes and Space",
        "Measurement",
        "Position and Transformation",
        "Data",
        "Chance or Probability",
      ],
    },
    "Integrated Science": {
      source: "JHS_SCIENCE",
      topics: [
        "Matter",
        "Energy",
        "Forces and Motion",
        "Living Things",
        "Cells",
        "Human Body",
        "Reproduction",
        "Ecology",
        "Earth and Space",
        "Health",
      ],
    },
  },
  SHS1: {
    Mathematics: {
      source: "SHS_MATHEMATICS",
      topics: [
        "Numbers for Everyday Life",
        "Real Number System",
        "Proportional Reasoning",
        "Applications of Expressions, Equations and Inequalities",
        "Patterns and Relationships",
        "Geometry Around Us",
        "Spatial Sense",
        "Measurement",
        "Statistical Reasoning and Its Application in Real Life",
        "Probability/Chance",
      ],
    },
    Physics: { source: "SHS_PHYSICS", topics: ["Mechanics", "Matter", "Waves", "Electricity", "Heat", "Measurement"] },
    Chemistry: { source: "SHS_CHEMISTRY", topics: ["Matter", "Atomic Structure", "Chemical Bonding", "Stoichiometry", "Chemical Reactions", "Acids and Bases", "Organic Chemistry"] },
    Biology: { source: "SHS_BIOLOGY", topics: ["Biology as the Science of Life", "Cell Structure and Functions", "Living Organisms", "Ecology", "Diseases and Infections", "Mammalian Systems", "Plant Systems"] },
  },
  SHS2: {
    Mathematics: {
      source: "SHS_MATHEMATICS",
      topics: [
        "Numbers for Everyday Life",
        "Real Number and Numeration System",
        "Applications of Expressions, Equations and Inequalities",
        "Patterns and Relationships",
        "Geometry Around Us",
        "Spatial Sense",
        "Measurement",
        "Statistical Reasoning and Its Application in Real Life",
        "Probability/Chance",
      ],
    },
    Physics: { source: "SHS_PHYSICS", topics: ["Mechanics", "Matter", "Waves", "Electricity", "Heat", "Measurement"] },
    Chemistry: { source: "SHS_CHEMISTRY", topics: ["Matter", "Atomic Structure", "Chemical Bonding", "Stoichiometry", "Chemical Reactions", "Acids and Bases", "Organic Chemistry"] },
    Biology: { source: "SHS_BIOLOGY", topics: ["Biology as the Science of Life", "Movement of Substances in Living Organisms", "Cell Structure and Functions", "Living Organisms", "Ecology", "Diseases and Infections", "Mammalian Systems", "Plant Systems"] },
  },
  SHS3: {
    Mathematics: {
      source: "SHS_MATHEMATICS",
      topics: [
        "Numbers for Everyday Life",
        "Real Number System",
        "Proportional Reasoning",
        "Applications of Expressions, Equations and Inequalities",
        "Patterns and Relationships",
        "Geometry Around Us",
        "Spatial Sense",
        "Measurement",
        "Statistical Reasoning and Its Application in Real Life",
        "Probability/Chance",
      ],
    },
    Physics: { source: "SHS_PHYSICS", topics: ["Mechanics", "Matter", "Waves", "Electricity", "Heat", "Measurement"] },
    Chemistry: { source: "SHS_CHEMISTRY", topics: ["Matter", "Atomic Structure", "Chemical Bonding", "Stoichiometry", "Chemical Reactions", "Acids and Bases", "Organic Chemistry"] },
    Biology: { source: "SHS_BIOLOGY", topics: ["Biology as the Science of Life", "Cell Structure and Functions", "Living Organisms", "Ecology", "Diseases and Infections", "Mammalian Systems", "Plant Systems"] },
  },
};

function normalizeGrade(value) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim().replace(/_/g, " ");
  return GRADE_ALIASES[raw] || GRADE_ALIASES[raw.toUpperCase()] || null;
}

function normalizeSubject(value, grade) {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  const subject = SUBJECT_ALIASES[raw.toLowerCase()] || raw;

  if (subject === "Integrated Science" && grade && grade.startsWith("SHS")) {
    return "General Science";
  }

  return subject;
}

function normalizeTopic(value) {
  if (value === undefined || value === null) return null;
  return String(value).trim().replace(/\s+/g, " ");
}

function getCurriculum(grade) {
  const normalizedGrade = normalizeGrade(grade);
  return normalizedGrade ? CURRICULUM[normalizedGrade] || null : null;
}

function getSubjectsForGrade(grade) {
  const curriculum = getCurriculum(grade);
  return curriculum ? Object.keys(curriculum) : [];
}

function getTopicsForSubject(grade, subject) {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedSubject = normalizeSubject(subject, normalizedGrade);
  const curriculum = normalizedGrade ? CURRICULUM[normalizedGrade] : null;
  return curriculum && curriculum[normalizedSubject]
    ? curriculum[normalizedSubject].topics.slice()
    : [];
}

function resolveTopic(grade, subject, topic) {
  const topics = getTopicsForSubject(grade, subject);
  if (!topics.length || !topic) return null;
  const target = normalizeTopic(topic).toLowerCase();
  return topics.find((item) => item.toLowerCase() === target) || null;
}

function validateRequest({ grade, subject, topic }) {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedSubject = normalizeSubject(subject, normalizedGrade);

  if (!normalizedGrade) {
    return { valid: false, code: "INVALID_GRADE", message: "Unsupported or missing grade." };
  }

  const curriculum = CURRICULUM[normalizedGrade];
  if (!curriculum) {
    return { valid: false, code: "INVALID_GRADE", message: `No curriculum is configured for ${normalizedGrade}.` };
  }

  if (!normalizedSubject || !curriculum[normalizedSubject]) {
    return {
      valid: false,
      code: "INVALID_SUBJECT",
      message: `${subject || "This subject"} is not available for ${normalizedGrade}.`,
      grade: normalizedGrade,
      availableSubjects: Object.keys(curriculum),
    };
  }

  const normalizedTopic = resolveTopic(normalizedGrade, normalizedSubject, topic);
  if (!normalizedTopic) {
    return {
      valid: false,
      code: "INVALID_TOPIC",
      message: `${topic || "This topic"} is not configured for ${normalizedGrade} ${normalizedSubject}.`,
      grade: normalizedGrade,
      subject: normalizedSubject,
      availableTopics: curriculum[normalizedSubject].topics.slice(),
    };
  }

  return {
    valid: true,
    grade: normalizedGrade,
    academicLevel: normalizedGrade.startsWith("JHS") ? "JHS" : "SHS",
    subject: normalizedSubject,
    topic: normalizedTopic,
    source: curriculum[normalizedSubject].source,
  };
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
