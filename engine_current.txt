const { getKnowledgeContext } = require("./textbookAdapter");
const { validateQuestion, transformQuestion, makeMixedType, signature } = require("./questionQualityEngine");
const { loadLocalTextbook, buildKnowledgeContext } = require("./textbookEngine");
const { validateRequest, normalizeGrade, normalizeSubject } = require("./curriculumEngine");
const crypto = require("crypto");

/*
=========================================================
 EduGen Dynamic Question Engine v2
 --------------------------------------------------------
 - No hardcoded question repetition
 - Difficulty-aware generation
 - True/False support
 - Problem Solving support
 - Word Problem support
 - Large Expert numbers
 - Expanded Mathematics
 - Expanded Biology
 - Expanded Physics
 - Expanded Chemistry
=========================================================
*/

/* ========================================================
   UTILITIES
======================================================== */

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min, max, decimals = 2) => {
  const factor = 10 ** decimals;
  return (
    Math.round(
      (Math.random() * (max - min) + min) * factor
    ) / factor
  );
};

const randomItem = (array) =>
  array[Math.floor(Math.random() * array.length)];

const shuffle = (array) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
};

const makeId = () =>
  crypto.randomBytes(8).toString("hex");

const fmt = (number, decimals = 2) => {
  if (!Number.isFinite(Number(number))) {
    return String(number);
  }

  const value = Number(number);

  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(
    Number(value.toFixed(decimals))
  );
};

const cleanText = (text) =>
  String(text)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/* ========================================================
   DIFFICULTY HELPERS
======================================================== */

/* ========================================================
   LEVEL + DIFFICULTY INTELLIGENCE
======================================================== */

/*
=========================================================
 EduGen Difficulty System
 --------------------------------------------------------
 Difficulty is NOT just about larger numbers.

 Level:
 - JHS
 - SHS
 - University

 Difficulty:
 - Easy
 - Medium
 - Hard
 - Expert

 Expert prioritizes:
 - Multi-step reasoning
 - Multiple concepts
 - Indirect information
 - Interpretation
 - Common mistakes
 - Plausible distractors
 - Deeper problem solving
=========================================================
*/

const difficultyRange = {
  Easy: {
    small: [2, 10],
    medium: [10, 50],
    large: [50, 500],
  },

  Medium: {
    small: [5, 20],
    medium: [20, 200],
    large: [100, 2000],
  },

  Hard: {
    small: [10, 50],
    medium: [50, 1000],
    large: [500, 10000],
  },

  Expert: {
    small: [50, 500],
    medium: [500, 10000],
    large: [10000, 999999],
  },
};

/*
=========================================================
 ACADEMIC LEVEL PROFILES
=========================================================
*/

const levelProfiles = {
  JHS: {
    name: "JHS",

    reasoningDepth: {
      Easy: 1,
      Medium: 2,
      Hard: 3,
      Expert: 5,
    },

    maxSteps: {
      Easy: 1,
      Medium: 2,
      Hard: 3,
      Expert: 5,
    },

    expertStyle: [
      "multi-step reasoning",
      "hidden relationships",
      "careful interpretation",
      "common-mistake traps",
      "indirect information",
    ],
  },

  SHS: {
    name: "SHS",

    reasoningDepth: {
      Easy: 1,
      Medium: 2,
      Hard: 4,
      Expert: 6,
    },

    maxSteps: {
      Easy: 1,
      Medium: 2,
      Hard: 4,
      Expert: 6,
    },

    expertStyle: [
      "multi-concept reasoning",
      "indirect calculation",
      "algebraic manipulation",
      "interpretation of data",
      "common-mistake traps",
      "reverse reasoning",
    ],
  },

  University: {
    name: "University",

    reasoningDepth: {
      Easy: 2,
      Medium: 3,
      Hard: 5,
      Expert: 8,
    },

    maxSteps: {
      Easy: 2,
      Medium: 3,
      Hard: 5,
      Expert: 8,
    },

    expertStyle: [
      "multi-concept reasoning",
      "abstract reasoning",
      "reverse reasoning",
      "assumption checking",
      "mathematical modelling",
      "interpretation",
      "proof or justification",
      "common-mistake traps",
    ],
  },
};

/*
=========================================================
 NORMALIZE ACADEMIC LEVEL
=========================================================
*/

function normalizeLevel(level) {
  const value =
    String(level || "")
      .trim()
      .toLowerCase();

  if (
    value.includes("university") ||
    value.includes("undergraduate") ||
    value.includes("tertiary")
  ) {
    return "University";
  }

  if (
    value.includes("shs") ||
    value.includes("senior") ||
    value.includes("high school")
  ) {
    return "SHS";
  }

  if (
    value.includes("jhs") ||
    value.includes("junior") ||
    value.includes("middle school")
  ) {
    return "JHS";
  }

  /*
    Default to SHS because the existing
    EduGen engine was primarily built
    around secondary-school content.
  */

  return "SHS";
}

/*
=========================================================
 NORMALIZE DIFFICULTY
=========================================================
*/

function normalizeDifficulty(difficulty) {
  const value =
    String(difficulty || "")
      .trim()
      .toLowerCase();

  if (value === "easy") {
    return "Easy";
  }

  if (value === "medium") {
    return "Medium";
  }

  if (value === "hard") {
    return "Hard";
  }

  if (value === "expert") {
    return "Expert";
  }

  return "Medium";
}

/*
=========================================================
 GET LEVEL PROFILE
=========================================================
*/

function getLevelProfile(
  level,
  difficulty
) {
  const normalizedLevel =
    normalizeLevel(level);

  const normalizedDifficulty =
    normalizeDifficulty(
      difficulty
    );

  const profile =
    levelProfiles[
      normalizedLevel
    ];

  return {
    level:
      normalizedLevel,

    difficulty:
      normalizedDifficulty,

    reasoningDepth:
      profile.reasoningDepth[
        normalizedDifficulty
      ],

    maxSteps:
      profile.maxSteps[
        normalizedDifficulty
      ],

    expert:
      normalizedDifficulty ===
      "Expert",

    expertStyle:
      profile.expertStyle,
  };
}

/*
=========================================================
 RANDOM RANGE
=========================================================
*/

function range(
  difficulty,
  size = "medium"
) {
  const normalizedDifficulty =
    normalizeDifficulty(
      difficulty
    );

  const selected =
    difficultyRange[
      normalizedDifficulty
    ] ||
    difficultyRange.Medium;

  const [min, max] =
    selected[size];

  return randomInt(
    min,
    max
  );
}

/*
=========================================================
 LEVEL-AWARE NUMBER RANGE
=========================================================

This prevents University from simply
being "SHS with bigger numbers".

The level can influence the numerical
complexity while the actual reasoning
comes from the generator.
=========================================================
*/

function levelRange(
  level,
  difficulty,
  size = "medium"
) {
  const normalizedLevel =
    normalizeLevel(level);

  const normalizedDifficulty =
    normalizeDifficulty(
      difficulty
    );

  /*
    JHS keeps numbers manageable.
  */

  if (
    normalizedLevel === "JHS"
  ) {
    const ranges = {
      Easy: {
        small: [2, 10],
        medium: [10, 50],
        large: [50, 500],
      },

      Medium: {
        small: [3, 15],
        medium: [15, 100],
        large: [100, 1000],
      },

      Hard: {
        small: [5, 25],
        medium: [25, 200],
        large: [200, 5000],
      },

      Expert: {
        small: [8, 40],
        medium: [40, 500],
        large: [500, 20000],
      },
    };

    const [min, max] =
      ranges[
        normalizedDifficulty
      ][size];

    return randomInt(
      min,
      max
    );
  }

  /*
    SHS uses the original
    difficulty-aware ranges.
  */

  if (
    normalizedLevel === "SHS"
  ) {
    return range(
      normalizedDifficulty,
      size
    );
  }

  /*
    University can use larger
    numerical ranges where appropriate,
    but the real difficulty should come
    from reasoning rather than huge numbers.
  */

  const universityRanges = {
    Easy: {
      small: [2, 20],
      medium: [10, 100],
      large: [100, 5000],
    },

    Medium: {
      small: [5, 30],
      medium: [20, 500],
      large: [500, 10000],
    },

    Hard: {
      small: [10, 50],
      medium: [50, 2000],
      large: [1000, 100000],
    },

    Expert: {
      small: [10, 100],
      medium: [50, 10000],
      large: [1000, 1000000],
    },
  };

  const [min, max] =
    universityRanges[
      normalizedDifficulty
    ][size];

  return randomInt(
    min,
    max
  );
}

/*
=========================================================
 REASONING PROFILE
=========================================================
*/

function getReasoningProfile(
  level,
  difficulty
) {
  const profile =
    getLevelProfile(
      level,
      difficulty
    );

  if (!profile.expert) {
    return {
      depth:
        profile.reasoningDepth,

      steps:
        profile.maxSteps,

      style: [
        "direct application",
      ],
    };
  }

  return {
    depth:
      profile.reasoningDepth,

    steps:
      profile.maxSteps,

    style:
      shuffle(
        profile.expertStyle
      ).slice(
        0,
        Math.min(
          4,
          profile.expertStyle.length
        )
      ),
  };
}

/*
=========================================================
 EXPERT REASONING INSTRUCTION
=========================================================

Generators can use this to construct
questions that require actual reasoning.
It does NOT reveal the answer.
=========================================================
*/

function expertReasoningInstruction(
  level,
  topic,
  difficulty
) {
  const profile =
    getReasoningProfile(
      level,
      difficulty
    );

  if (!profile.expert) {
    return "";
  }

  const instruction =
    randomItem([
      "Determine the answer by connecting the relevant pieces of information rather than applying a formula immediately.",
      "Identify what must be determined first before the final quantity can be found.",
      "Use the information indirectly: not every value should be used in the first step.",
      "Check the relationship between the given quantities before choosing a method.",
      "Consider whether the problem requires more than one stage of reasoning.",
      "Look carefully for a hidden relationship between the quantities provided.",
      "Do not assume that the most obvious quantity is the one being asked for.",
      "Work backwards from the required result where appropriate.",
      "Consider which principle explains the situation before performing calculations.",
    ]);

  return (
    `\n\nExpert reasoning focus: ${instruction}`
  );
}

/*
=========================================================
 COMMON MISTAKE TYPES
=========================================================

These are mistake patterns, NOT hardcoded
questions. Generators can use them to
construct intelligent distractors.
=========================================================
*/

const commonMistakeTypes = [
  "forgot_first_step",
  "used_wrong_operation",
  "reversed_operation",
  "ignored_negative_sign",
  "incorrect_order_of_operations",
  "forgot_unit_conversion",
  "used_final_value_instead_of_change",
  "used_change_instead_of_final_value",
  "used_wrong_formula",
  "stopped_after_intermediate_result",
  "forgot_coefficient",
  "distributed_operation_incorrectly",
  "used_wrong_ratio",
  "reversed_ratio",
  "forgot_percentage_conversion",
  "added_percentages_instead_of_multiplying",
  "rounded_too_early",
  "used_incorrect_sign",
  "ignored_given_condition",
  "used_irrelevant_information",
];

/*
=========================================================
 SELECT MISTAKE TYPES
=========================================================
*/

function selectMistakeTypes(
  count = 3
) {
  return shuffle(
    commonMistakeTypes
  ).slice(
    0,
    count
  );
}

/*
=========================================================
 DIFFICULTY-AWARE REASONING TEXT
=========================================================
*/

function reasoningPrompt(
  level,
  difficulty,
  topic
) {
  const profile =
    getReasoningProfile(
      level,
      difficulty
    );

  if (!profile.expert) {
    return `Apply the relevant ${topic || "concept"} correctly.`;
  }

  return (
    `This ${profile.level} Expert problem requires ` +
    `${profile.depth} levels of reasoning. ` +
    `Consider the relationships between the given information ` +
    `before calculating or selecting an answer.`
  );
}

/* ========================================================
   INTELLIGENT DISTRACTORS
======================================================== */

/*
=========================================================
 EduGen Dynamic Distractor Engine
 --------------------------------------------------------
 Wrong answers are generated from realistic mistakes.

 IMPORTANT:
 - No fixed question bank
 - No fixed answer lists
 - Distractors are calculated dynamically
 - Expert questions use more plausible mistakes
=========================================================
*/

/* ========================================================
   NUMERIC MISTAKE GENERATORS
======================================================== */

function generateNumericMistakes(
  answer,
  context = {}
) {
  const numericAnswer =
    Number(answer);

  if (
    !Number.isFinite(
      numericAnswer
    )
  ) {
    return [];
  }

  const {
    spread = 10,
    difficulty = "Medium",
  } = context;

  const mistakes = [];

  /*
    1. Intermediate-result mistake
    Produces a value reasonably close to
    the correct answer.
  */

  const intermediate =
    numericAnswer +
    randomInt(
      -Math.max(
        1,
        Math.round(
          Math.abs(
            numericAnswer
          ) * 0.15
        )
      ),
      Math.max(
        1,
        Math.round(
          Math.abs(
            numericAnswer
          ) * 0.15
        )
      )
    );

  mistakes.push(
    intermediate
  );

  /*
    2. Operation/sign mistake
  */

  if (
    numericAnswer !== 0
  ) {
    mistakes.push(
      -numericAnswer
    );
  }

  /*
    3. Percentage/scale mistake
  */

  if (
    Math.abs(
      numericAnswer
    ) >= 10
  ) {
    mistakes.push(
      numericAnswer / 10
    );

    mistakes.push(
      numericAnswer * 10
    );
  }

  /*
    4. Nearby calculation mistake
  */

  const variation =
    Math.max(
      1,
      Math.round(
        Math.abs(
          numericAnswer
        ) > 100
          ? Math.abs(
              numericAnswer
            ) * 0.05
          : spread
      )
    );

  mistakes.push(
    numericAnswer +
      randomInt(
        -variation,
        variation
      )
  );

  /*
    5. Common arithmetic mistake
    Such as stopping one step early.
  */

  if (
    Number.isInteger(
      numericAnswer
    )
  ) {
    mistakes.push(
      numericAnswer +
        randomItem([
          -2,
          -1,
          1,
          2,
        ])
    );
  }

  /*
    6. Square/root-style mistake.
    Useful for mathematical questions.
  */

  if (
    numericAnswer > 0
  ) {
    const root =
      Math.sqrt(
        numericAnswer
      );

    if (
      Number.isFinite(root) &&
      root !== numericAnswer
    ) {
      mistakes.push(root);
    }
  }

  /*
    7. Reciprocal mistake
  */

  if (
    numericAnswer !== 0
  ) {
    mistakes.push(
      1 / numericAnswer
    );
  }

  /*
    Expert questions get slightly
    more sophisticated distractors.
  */

  if (
    difficulty === "Expert"
  ) {
    mistakes.push(
      numericAnswer *
        0.75
    );

    mistakes.push(
      numericAnswer *
        1.25
    );
  }

  /*
    Remove invalid values,
    duplicates and the real answer.
  */

  return [
    ...new Set(
      mistakes
        .filter(
          (value) =>
            Number.isFinite(
              Number(value)
            )
        )
        .filter(
          (value) =>
            Number(value) !==
            numericAnswer
        )
        .map(
          (value) =>
            Number(value)
        )
    ),
  ];
}

/* ========================================================
   SMART NUMERIC OPTIONS
======================================================== */

function numericOptions(
  answer,
  spread = 10,
  context = {}
) {
  const numericAnswer =
    Number(answer);

  if (
    !Number.isFinite(
      numericAnswer
    )
  ) {
    return [
      String(answer),
      "None of the above",
      "Cannot be determined",
      "Insufficient information",
    ];
  }

  const mistakes =
    generateNumericMistakes(
      numericAnswer,
      {
        spread,
        ...context,
      }
    );

  const values =
    [
      numericAnswer,
      ...mistakes,
    ];

  /*
    Continue generating if we don't
    have enough plausible answers.
  */

  let attempts = 0;

  while (
    new Set(values).size < 4 &&
    attempts < 100
  ) {
    attempts++;

    const variation =
      Math.max(
        1,
        Math.round(
          Math.abs(
            numericAnswer
          ) > 100
            ? Math.abs(
                numericAnswer
              ) * 0.08
            : spread
        )
      );

    const wrong =
      numericAnswer +
      randomInt(
        -variation,
        variation
      );

    if (
      Number.isFinite(
        wrong
      ) &&
      wrong !==
        numericAnswer
    ) {
      values.push(
        wrong
      );
    }
  }

  /*
    Final fallback.
  */

  while (
    new Set(values).size < 4
  ) {
    values.push(
      numericAnswer +
        randomInt(
          1,
          20
        )
    );
  }

  return shuffle(
    [
      ...new Set(
        values
      ),
    ]
      .slice(0, 4)
      .map(
        (value) =>
          fmt(value)
      )
  );
}

/* ========================================================
   DISTRACTOR REASONING
======================================================== */

/*
  Creates internal metadata explaining
  how a wrong answer could have happened.

  This is NOT shown to the student
  before submission.
*/

function generateDistractorMetadata(
  correctAnswer,
  distractor,
  context = {}
) {
  const numericCorrect =
    Number(correctAnswer);

  const numericDistractor =
    Number(distractor);

  if (
    Number.isFinite(
      numericCorrect
    ) &&
    Number.isFinite(
      numericDistractor
    )
  ) {
    const ratio =
      numericCorrect !== 0
        ? Math.abs(
            numericDistractor /
              numericCorrect
          )
        : 0;

    if (
      Math.abs(
        numericDistractor +
          numericCorrect
      ) <
      Math.abs(
        numericCorrect
      ) * 0.05
    ) {
      return {
        answer: String(
          distractor
        ),
        mistake:
          "A sign or direction was reversed.",
      };
    }

    if (
      ratio >= 9 &&
      ratio <= 11
    ) {
      return {
        answer: String(
          distractor
        ),
        mistake:
          "A place-value, scale, or unit conversion error may have occurred.",
      };
    }

    if (
      ratio >= 0.09 &&
      ratio <= 0.11
    ) {
      return {
        answer: String(
          distractor
        ),
        mistake:
          "A scale or unit conversion may have been applied in the wrong direction.",
      };
    }

    if (
      ratio >= 0.7 &&
      ratio <= 0.8
    ) {
      return {
        answer: String(
          distractor
        ),
        mistake:
          "An intermediate calculation may have been used instead of completing the final step.",
      };
    }

    if (
      ratio >= 1.2 &&
      ratio <= 1.3
    ) {
      return {
        answer: String(
          distractor
        ),
        mistake:
          "An additional operation may have been applied when it was not required.",
      };
    }

    return {
      answer: String(
        distractor
      ),
      mistake:
        "A small arithmetic or calculation error may have occurred.",
    };
  }

  /*
    Conceptual fallback.
  */

  return {
    answer: String(
      distractor
    ),
    mistake:
      "This represents a plausible misunderstanding of the underlying concept.",
  };
}

/* ========================================================
   BUILD DISTRACTOR METADATA
======================================================== */

function buildDistractorMetadata(
  answer,
  options,
  context = {}
) {
  return options
    .filter(
      (option) =>
        String(option) !==
        String(answer)
    )
    .map(
      (option) =>
        generateDistractorMetadata(
          answer,
          option,
          context
        )
    );
}

/* ========================================================
   MULTIPLE CHOICE HELPER
======================================================== */

function makeMCQ(
  answer,
  options,
  explanation,
  extra = {}
) {
  let finalOptions = [
    String(answer),
    ...(options || [])
      .map(
        (option) =>
          String(option)
      ),
  ];

  /*
    Remove duplicates.
  */

  finalOptions = [
    ...new Set(
      finalOptions
    ),
  ];

  /*
    If fewer than four options
    exist, dynamically generate
    numeric alternatives when possible.
  */

  if (
    finalOptions.length <
      4 &&
    Number.isFinite(
      Number(answer)
    )
  ) {
    const generated =
      numericOptions(
        Number(answer),
        10,
        {
          difficulty:
            extra.difficulty ||
            "Medium",
        }
      );

    finalOptions = [
      ...new Set([
        ...finalOptions,
        ...generated,
      ]),
    ];
  }

  /*
    Generic fallback only if the
    answer itself is non-numeric and
    there aren't enough choices.
  */

  while (
    finalOptions.length <
    4
  ) {
    finalOptions.push(
      `Alternative ${
        finalOptions.length +
        1
      }`
    );
  }

  finalOptions =
    finalOptions.slice(
      0,
      4
    );

  /*
    Generate internal metadata
    for the incorrect choices.
  */

  const distractorMetadata =
    buildDistractorMetadata(
      answer,
      finalOptions,
      extra
    );

  return {
    ...extra,

    answer:
      String(answer),

    options:
      shuffle(
        finalOptions
      ),

    explanation,

    /*
      Internal educational metadata.
      The frontend can use this AFTER
      submission to explain common mistakes.
    */

    distractors:
      distractorMetadata,
  };
}

/* ========================================================
   MATHEMATICS
======================================================== */

/* ---------- LINEAR EQUATIONS ---------- */

function linearEquation(difficulty) {
  let a;
  let b;
  let x;

  if (difficulty === "Easy") {
    a = randomInt(2, 8);
    b = randomInt(-15, 15);
    x = randomInt(1, 15);
  } else if (difficulty === "Medium") {
    a = randomInt(3, 15);
    b = randomInt(-50, 50);
    x = randomInt(-20, 20);
  } else if (difficulty === "Hard") {
    a = randomInt(8, 50);
    b = randomInt(-500, 500);
    x = randomInt(-100, 100);
  } else {
    a = randomInt(50, 500);
    b = randomInt(
      -99999,
      99999
    );
    x = randomInt(
      -1000,
      1000
    );
  }

  const c = a * x + b;

  const equation =
    `${a}x ${
      b >= 0 ? "+" : "-"
    } ${Math.abs(b)} = ${c}`;

  const answer = fmt(x);

  return {
    topic: "Linear Equations",

    question:
      `Solve the equation:\n\n${equation}\n\nFind x.`,

    ...makeMCQ(
      answer,
      numericOptions(
        x,
        difficulty === "Expert"
          ? 100
          : 10
      ),
      `Subtract ${
        b >= 0
          ? b
          : `(${b})`
      } from both sides and divide by ${a}.\n\n` +
        `${a}x = ${c - b}\n` +
        `x = ${x}.`
    ),

    learningObjective:
      "Solve linear equations using inverse operations.",
  };
}

/* ---------- SIMULTANEOUS EQUATIONS ---------- */

function simultaneousEquations(
  difficulty
) {
  const x =
    difficulty === "Expert"
      ? randomInt(-500, 500)
      : randomInt(-50, 50);

  const y =
    difficulty === "Expert"
      ? randomInt(-500, 500)
      : randomInt(-50, 50);

  let a = randomInt(2, 12);
  let b = randomInt(2, 12);
  let c = randomInt(2, 12);
  let d = randomInt(2, 12);

  if (a * d === b * c) {
    d++;
  }

  const e = a * x + b * y;
  const f = c * x + d * y;

  const answer =
    `x = ${x}, y = ${y}`;

  return {
    topic:
      "Simultaneous Equations",

    question:
      `Solve the simultaneous equations:\n\n` +
      `${a}x + ${b}y = ${e}\n` +
      `${c}x + ${d}y = ${f}\n\n` +
      `Find x and y.`,

    ...makeMCQ(
      answer,
      [
        `x = ${y}, y = ${x}`,
        `x = ${x + 1}, y = ${y - 1}`,
        `x = ${x - 2}, y = ${y + 2}`,
      ],
      `Use elimination or substitution.\n\n` +
        `Solving the system gives:\n` +
        `x = ${x}\n` +
        `y = ${y}.`
    ),

    learningObjective:
      "Solve simultaneous linear equations using elimination or substitution.",
  };
}

/* ---------- QUADRATICS ---------- */

function quadratic(difficulty) {
  const max =
    difficulty === "Easy"
      ? 6
      : difficulty === "Medium"
      ? 12
      : difficulty === "Hard"
      ? 30
      : 100;

  const r1 = randomInt(
    -max,
    max
  );

  const r2 = randomInt(
    -max,
    max
  );

  const b = -(r1 + r2);
  const c = r1 * r2;

  const bText =
    b >= 0
      ? `+ ${b}x`
      : `- ${Math.abs(b)}x`;

  const cText =
    c >= 0
      ? `+ ${c}`
      : `- ${Math.abs(c)}`;

  const answer =
    `${Math.min(r1, r2)} and ${Math.max(
      r1,
      r2
    )}`;

  return {
    topic:
      "Quadratic Equations",

    question:
      `Solve:\n\n` +
      `x² ${bText} ${cText} = 0\n\n` +
      `Give both roots.`,

    ...makeMCQ(
      answer,
      [
        `${r1 + 1} and ${r2 + 1}`,
        `${-r1} and ${-r2}`,
        `${r1 - 2} and ${r2 + 2}`,
      ],
      `Factorise the quadratic into:\n\n` +
        `(x - ${r1})(x - ${r2}) = 0\n\n` +
        `Therefore the roots are ${r1} and ${r2}.`
    ),

    learningObjective:
      "Solve quadratic equations using factorisation.",
  };
}

/* ---------- PERCENTAGES ---------- */

function percentage(
  difficulty
) {
  const original =
    difficulty === "Expert"
      ? range(difficulty, "large")
      : range(difficulty, "medium");

  const increase =
    difficulty === "Expert"
      ? randomFloat(12.5, 87.5, 1)
      : randomInt(5, 40);

  const decrease =
    difficulty === "Expert"
      ? randomFloat(7.5, 62.5, 1)
      : randomInt(5, 30);

  const afterIncrease =
    original *
    (1 + increase / 100);

  const finalValue =
    afterIncrease *
    (1 - decrease / 100);

  const answer =
    Math.round(
      finalValue * 100
    ) / 100;

  return {
    topic: "Percentages",

    question:
      `An amount of GH₵${original.toLocaleString()} ` +
      `increases by ${increase}% and then decreases by ${decrease}%.\n\n` +
      `Calculate the final amount.`,

    ...makeMCQ(
      `GH₵${fmt(answer)}`,
      [
        `GH₵${fmt(
          original *
            (1 +
              (increase -
                decrease) /
                100)
        )}`,
        `GH₵${fmt(
          original *
            (1 -
              decrease /
                100)
        )}`,
        `GH₵${fmt(
          original *
            (1 +
              decrease /
                100)
        )}`,
      ],
      `First increase:\n` +
        `GH₵${original} × ${
          1 + increase / 100
        } = GH₵${fmt(
          afterIncrease
        )}\n\n` +
        `Then decrease:\n` +
        `GH₵${fmt(
          afterIncrease
        )} × ${
          1 -
          decrease / 100
        } = GH₵${fmt(
          answer
        )}.`
    ),

    learningObjective:
      "Apply successive percentage changes.",
  };
}

/* ---------- RATIO ---------- */

function ratio(difficulty) {
  const a = range(
    difficulty,
    "small"
  );

  const b = range(
    difficulty,
    "small"
  );

  const c = range(
    difficulty,
    "small"
  );

  const multiplier =
    difficulty === "Expert"
      ? randomInt(50, 500)
      : randomInt(3, 30);

  const total =
    (a + b + c) *
    multiplier;

  const largest =
    Math.max(a, b, c) *
    multiplier;

  return {
    topic: "Ratio",

    question:
      `Three quantities are in the ratio ` +
      `${a}:${b}:${c}.\n\n` +
      `Their total is ${total}.\n\n` +
      `What is the largest quantity?`,

    ...makeMCQ(
      fmt(largest),
      numericOptions(
        largest,
        difficulty === "Expert"
          ? 100
          : 20
      ),
      `Total ratio parts = ${
        a + b + c
      }.\n\n` +
        `One ratio part = ${total} ÷ ${
          a + b + c
        } = ${multiplier}.\n\n` +
        `Largest quantity = ${
          Math.max(a, b, c)
        } × ${multiplier} = ${largest}.`
    ),

    learningObjective:
      "Use ratios to divide quantities and solve proportional problems.",
  };
}

/* ---------- INDICES ---------- */

function indices(difficulty) {
  const base =
    difficulty === "Expert"
      ? randomInt(5, 25)
      : randomInt(2, 10);

  const exponent =
    difficulty === "Easy"
      ? randomInt(2, 4)
      : difficulty === "Medium"
      ? randomInt(3, 6)
      : difficulty === "Hard"
      ? randomInt(4, 8)
      : randomInt(5, 10);

  const answer =
    base ** exponent;

  return {
    topic: "Indices",

    question:
      `Evaluate:\n\n` +
      `${base}^${exponent}`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(
        answer,
        Math.max(
          10,
          Math.round(
            answer * 0.1
          )
        )
      ),
      `${base} is multiplied by itself ${exponent} times.\n\n` +
        `${base}^${exponent} = ${answer}.`
    ),

    learningObjective:
      "Evaluate powers and apply laws of indices.",
  };
}

/* ---------- LOGARITHMS ---------- */

function logarithms(
  difficulty
) {
  const base =
    difficulty === "Expert"
      ? randomItem([2, 3, 5, 10])
      : randomItem([2, 10]);

  const exponent =
    difficulty === "Expert"
      ? randomInt(4, 9)
      : randomInt(1, 5);

  const value =
    base ** exponent;

  return {
    topic: "Logarithms",

    question:
      `Evaluate:\n\n` +
      `log₍${base}₎(${value})`,

    ...makeMCQ(
      fmt(exponent),
      numericOptions(
        exponent,
        3
      ),
      `Since ${base}^${exponent} = ${value},\n\n` +
        `log₍${base}₎(${value}) = ${exponent}.`
    ),

    learningObjective:
      "Understand logarithms as inverse operations of exponentiation.",
  };
}

/* ---------- SEQUENCES ---------- */

function sequences(
  difficulty
) {
  const first =
    difficulty === "Expert"
      ? randomInt(100, 5000)
      : randomInt(2, 100);

  const difference =
    difficulty === "Expert"
      ? randomInt(50, 500)
      : randomInt(2, 30);

  const n =
    difficulty === "Expert"
      ? randomInt(50, 500)
      : randomInt(8, 30);

  const answer =
    first +
    (n - 1) *
      difference;

  return {
    topic: "Sequences",

    question:
      `An arithmetic sequence begins:\n\n` +
      `${first}, ${
        first + difference
      }, ${
        first + 2 * difference
      }, ...\n\n` +
      `Find the ${n}th term.`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(
        answer,
        100
      ),
      `For an arithmetic sequence:\n\n` +
        `aₙ = a + (n - 1)d\n\n` +
        `aₙ = ${first} + (${n} - 1)(${difference})\n` +
        `= ${answer}.`
    ),

    learningObjective:
      "Find the nth term of an arithmetic sequence.",
  };
}

/* ---------- PROBABILITY ---------- */

function probability(
  difficulty
) {
  const red =
    difficulty === "Expert"
      ? randomInt(20, 80)
      : randomInt(2, 15);

  const blue =
    difficulty === "Expert"
      ? randomInt(20, 80)
      : randomInt(2, 15);

  const green =
    difficulty === "Expert"
      ? randomInt(20, 80)
      : randomInt(2, 15);

  const total =
    red + blue + green;

  const answer =
    `${red}/${total}`;

  return {
    topic: "Probability",

    question:
      `A box contains ${red} red, ${blue} blue and ${green} green balls.\n\n` +
      `One ball is selected at random.\n\n` +
      `What is the probability of selecting a red ball?`,

    ...makeMCQ(
      answer,
      [
        `${blue}/${total}`,
        `${green}/${total}`,
        `${red}/${blue + green}`,
      ],
      `Probability = favourable outcomes ÷ total outcomes.\n\n` +
        `Therefore:\n` +
        `P(red) = ${red}/${total}.`
    ),

    learningObjective:
      "Calculate theoretical probability from equally likely outcomes.",
  };
}

/* ---------- STATISTICS ---------- */

function statistics(
  difficulty
) {
  const count =
    difficulty === "Expert"
      ? 15
      : difficulty === "Hard"
      ? 12
      : 8;

  const numbers =
    Array.from(
      { length: count },
      () =>
        randomInt(
          difficulty === "Expert"
            ? 50
            : 5,
          difficulty === "Expert"
            ? 500
            : 80
        )
    );

  const sum =
    numbers.reduce(
      (a, b) => a + b,
      0
    );

  const mean =
    Math.round(
      (sum / count) * 100
    ) / 100;

  return {
    topic: "Statistics",

    question:
      `The following data were recorded:\n\n` +
      `${numbers.join(", ")}\n\n` +
      `Calculate the arithmetic mean.`,

    ...makeMCQ(
      fmt(mean),
      [
        fmt(
          mean + randomInt(2, 10)
        ),
        fmt(
          mean - randomInt(2, 10)
        ),
        fmt(
          sum / (count + 1)
        ),
      ],
      `Mean = total ÷ number of values.\n\n` +
        `${sum} ÷ ${count} = ${fmt(
          mean
        )}.`
    ),

    learningObjective:
      "Calculate and interpret the arithmetic mean.",
  };
}

/* ---------- TRIGONOMETRY ---------- */

function trigonometry(
  difficulty
) {
  const angle =
    randomItem(
      difficulty === "Expert"
        ? [18, 23, 27, 32, 37, 41, 53, 67, 71]
        : [30, 45, 60]
    );

  const adjacent =
    difficulty === "Expert"
      ? randomInt(50, 1000)
      : randomInt(5, 50);

  const opposite =
    adjacent *
    Math.tan(
      (angle * Math.PI) /
        180
    );

  const answer =
    Math.round(
      opposite * 100
    ) / 100;

  return {
    topic: "Trigonometry",

    question:
      `A right-angled triangle has an angle of ${angle}°.\n\n` +
      `The adjacent side is ${adjacent} cm.\n\n` +
      `Using tan θ = opposite / adjacent, calculate the opposite side.`,

    ...makeMCQ(
      `${fmt(answer)} cm`,
      [
        `${fmt(
          answer * 0.8
        )} cm`,
        `${fmt(
          answer * 1.2
        )} cm`,
        `${fmt(
          answer + 10
        )} cm`,
      ],
      `tan(${angle}°) = opposite / ${adjacent}\n\n` +
        `opposite = ${adjacent} × tan(${angle}°)\n` +
        `≈ ${fmt(answer)} cm.`
    ),

    learningObjective:
      "Use trigonometric ratios to calculate unknown sides.",
  };
}

/* ---------- FUNCTIONS ---------- */

function functions(
  difficulty
) {
  const a =
    difficulty === "Expert"
      ? randomInt(10, 100)
      : randomInt(2, 15);

  const b =
    difficulty === "Expert"
      ? randomInt(
          -5000,
          5000
        )
      : randomInt(
          -50,
          50
        );

  const x =
    difficulty === "Expert"
      ? randomInt(
          -100,
          100
        )
      : randomInt(
          -10,
          10
        );

  const answer =
    a * x + b;

  return {
    topic: "Functions",

    question:
      `Given f(x) = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(
        b
      )}, calculate f(${x}).`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(
        answer,
        50
      ),
      `Substitute x = ${x}:\n\n` +
        `f(${x}) = ${a}(${x}) ${b >= 0 ? "+" : "-"} ${Math.abs(
          b
        )}\n\n` +
        `= ${answer}.`
    ),

    learningObjective:
      "Evaluate functions through algebraic substitution.",
  };
}

/* ---------- GEOMETRY ---------- */

function geometry(
  difficulty
) {
  const length =
    difficulty === "Expert"
      ? randomInt(50, 500)
      : randomInt(5, 50);

  const width =
    difficulty === "Expert"
      ? randomInt(25, 300)
      : randomInt(3, 30);

  const area =
    length * width;

  const perimeter =
    2 *
    (length + width);

  return {
    topic: "Geometry",

    question:
      `A rectangle has length ${length} cm and width ${width} cm.\n\n` +
      `Calculate its area and perimeter.`,

    ...makeMCQ(
      `Area = ${area} cm², Perimeter = ${perimeter} cm`,
      [
        `Area = ${perimeter} cm², Perimeter = ${area} cm`,
        `Area = ${area + width} cm², Perimeter = ${perimeter + 2} cm`,
        `Area = ${area - length} cm², Perimeter = ${perimeter - 4} cm`,
      ],
      `Area = length × width\n` +
        `= ${length} × ${width}\n` +
        `= ${area} cm².\n\n` +
        `Perimeter = 2(length + width)\n` +
        `= ${perimeter} cm.`
    ),

    learningObjective:
      "Apply formulae for area and perimeter.",
  };
}
  /* ========================================================
     EXPERT MATHEMATICS ENGINE
     --------------------------------------------------------
     Expert questions require multiple reasoning steps.
  ======================================================== */
/* ========================================================
   EXPERT MATHEMATICS ENGINE
   --------------------------------------------------------
   Expert questions require multiple reasoning steps.
======================================================== */

/* ---------- MULTI-STEP ALGEBRA ---------- */

function expertMultiStepAlgebra() {
  const x = randomInt(-40, 40);

  const a = randomInt(2, 12);
  const b = randomInt(2, 20);
  const c = randomInt(2, 15);
  const d = randomInt(5, 40);

  /*
    a(x + b) - c = d
  */

  const rhs = a * (x + b) - c;

  return {
    topic: "Advanced Algebra",

    question:
      `Solve the equation:\n\n` +
      `${a}(x + ${b}) - ${c} = ${rhs}\n\n` +
      `Find x.`,

    ...makeMCQ(
      fmt(x),
      numericOptions(x, 10),
      `First expand the bracket:\n\n` +
        `${a}x + ${a * b} - ${c} = ${rhs}\n\n` +
        `${a}x + ${a * b - c} = ${rhs}\n\n` +
        `Subtract ${a * b - c} from both sides:\n\n` +
        `${a}x = ${rhs - (a * b - c)}\n\n` +
        `Therefore:\n` +
        `x = ${x}.`
    ),

    learningObjective:
      "Solve multi-step linear equations involving brackets and inverse operations.",
  };
}

/* ---------- FRACTIONAL ALGEBRA ---------- */

function expertFractionEquation() {
  const denominator = randomInt(2, 12);
  const coefficient = randomInt(2, 15);
  const x = randomInt(-30, 30);
  const constant = randomInt(-20, 30);

  const result =
    (coefficient * x) /
      denominator +
    constant;

  return {
    topic: "Algebraic Fractions",

    question:
      `Solve for x:\n\n` +
      `(${coefficient}x / ${denominator}) + ${constant} = ${fmt(result)}\n\n` +
      `Give your answer as a number.`,

    ...makeMCQ(
      fmt(x),
      numericOptions(x, 8),
      `Subtract ${constant} from both sides:\n\n` +
        `(${coefficient}x / ${denominator}) = ${fmt(
          result - constant
        )}\n\n` +
        `Multiply both sides by ${denominator}:\n\n` +
        `${coefficient}x = ${fmt(
          (result - constant) *
            denominator
        )}\n\n` +
        `Divide by ${coefficient}:\n\n` +
        `x = ${x}.`
    ),

    learningObjective:
      "Solve equations involving algebraic fractions.",
  };
}

/* ---------- ADVANCED QUADRATIC ---------- */

function expertQuadraticReasoning() {
  const r1 = randomInt(-20, 20);
  const r2 = randomInt(-20, 20);

  const b = -(r1 + r2);
  const c = r1 * r2;

  const sumOfRoots =
    r1 + r2;

  const productOfRoots =
    r1 * r2;

  const target =
    randomItem([
      "sum",
      "product",
      "difference",
    ]);

  let answer;
  let questionEnding;

  if (target === "sum") {
    answer = sumOfRoots;

    questionEnding =
      `Without directly solving for x, determine the sum of the roots.`;
  } else if (target === "product") {
    answer = productOfRoots;

    questionEnding =
      `Without directly solving for x, determine the product of the roots.`;
  } else {
    answer =
      Math.abs(r1 - r2);

    questionEnding =
      `Determine the positive difference between the two roots.`;
  }

  return {
    topic: "Quadratic Equations",

    question:
      `Consider the quadratic equation:\n\n` +
      `x² ${b >= 0 ? "+" : "-"} ${Math.abs(
        b
      )}x ${c >= 0 ? "+" : "-"} ${Math.abs(
        c
      )} = 0\n\n` +
      `${questionEnding}`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(answer, 8),
      `For a quadratic:\n\n` +
        `x² + bx + c = 0\n\n` +
        `The sum of the roots is -b and the product of the roots is c.\n\n` +
        `Here the roots are ${r1} and ${r2}.\n\n` +
        `Therefore the required value is ${answer}.`
    ),

    learningObjective:
      "Use relationships between quadratic coefficients and roots.",
  };
}

/* ---------- COMPOUND PERCENTAGE ---------- */

function expertCompoundPercentage() {
  const original = randomInt(
    1000,
    50000
  );

  const increase1 =
    randomInt(8, 45);

  const decrease =
    randomInt(5, 35);

  const increase2 =
    randomInt(5, 30);

  const stage1 =
    original *
    (1 + increase1 / 100);

  const stage2 =
    stage1 *
    (1 - decrease / 100);

  const finalValue =
    stage2 *
    (1 + increase2 / 100);

  const answer =
    Math.round(
      finalValue * 100
    ) / 100;

  return {
    topic: "Advanced Percentages",

    question:
      `An investment is worth GH₵${original.toLocaleString()}.\n\n` +
      `It increases by ${increase1}%, then decreases by ${decrease}%, and finally increases by ${increase2}%.\n\n` +
      `What is its final value?`,

    ...makeMCQ(
      `GH₵${fmt(answer)}`,
      [
        `GH₵${fmt(
          original *
            (1 +
              (increase1 -
                decrease +
                increase2) /
                100)
        )}`,
        `GH₵${fmt(
          original *
            (1 +
              increase1 / 100)
        )}`,
        `GH₵${fmt(
          original *
            (1 -
              decrease / 100)
        )}`,
      ],
      `Stage 1:\n` +
        `GH₵${original} × ${1 +
          increase1 / 100} = GH₵${fmt(
          stage1
        )}\n\n` +
        `Stage 2:\n` +
        `GH₵${fmt(
          stage1
        )} × ${1 -
          decrease / 100} = GH₵${fmt(
          stage2
        )}\n\n` +
        `Stage 3:\n` +
        `GH₵${fmt(
          stage2
        )} × ${1 +
          increase2 / 100} = GH₵${fmt(
          answer
        )}.`
    ),

    learningObjective:
      "Apply successive percentage changes correctly.",
  };
}

/* ---------- ADVANCED RATIO ---------- */

function expertRatioReasoning() {
  const a = randomInt(2, 9);
  const b = randomInt(3, 12);
  const c = randomInt(4, 15);

  const multiplier =
    randomInt(20, 100);

  const originalTotal =
    (a + b + c) *
    multiplier;

  const newA =
    a * multiplier +
    randomInt(5, 30);

  const newB =
    b * multiplier;

  const newC =
    c * multiplier;

  const newTotal =
    newA + newB + newC;

  return {
    topic: "Advanced Ratio",

    question:
      `Three quantities are initially in the ratio ${a}:${b}:${c}.\n\n` +
      `Their total is ${originalTotal}.\n\n` +
      `The first quantity is then increased by ${newA -
        a * multiplier}.\n\n` +
      `The other two quantities remain unchanged.\n\n` +
      `What is the new total?`,

    ...makeMCQ(
      fmt(newTotal),
      numericOptions(newTotal, 30),
      `The original quantities are:\n\n` +
        `${a} × ${multiplier} = ${a *
          multiplier}\n` +
        `${b} × ${multiplier} = ${newB}\n` +
        `${c} × ${multiplier} = ${newC}\n\n` +
        `The first quantity becomes ${newA}.\n\n` +
        `New total = ${newA} + ${newB} + ${newC}\n` +
        `= ${newTotal}.`
    ),

    learningObjective:
      "Use proportional reasoning and track changes in related quantities.",
  };
}

/* ---------- ADVANCED SEQUENCE ---------- */

function expertSequence() {
  const first =
    randomInt(20, 200);

  const difference =
    randomInt(5, 40);

  const n =
    randomInt(20, 100);

  const target =
    first +
    (n - 1) *
      difference;

  const sum =
    (n / 2) *
    (2 * first +
      (n - 1) *
        difference);

  const askSum =
    Math.random() > 0.5;

  if (askSum) {
    return {
      topic: "Advanced Sequences",

      question:
        `An arithmetic sequence has first term ${first} and common difference ${difference}.\n\n` +
        `Calculate the sum of the first ${n} terms.`,

      ...makeMCQ(
        fmt(sum),
        numericOptions(sum, 500),
        `Use:\n\n` +
          `Sₙ = n/2 [2a + (n - 1)d]\n\n` +
          `Sₙ = ${n}/2 [2(${first}) + (${n} - 1)(${difference})]\n\n` +
          `Sₙ = ${fmt(sum)}.`
      ),

      learningObjective:
        "Calculate the sum of an arithmetic sequence.",
    };
  }

  return {
    topic: "Advanced Sequences",

    question:
      `An arithmetic sequence has first term ${first} and common difference ${difference}.\n\n` +
      `Which term has the value ${target}?`,

    ...makeMCQ(
      fmt(n),
      numericOptions(n, 8),
      `Use:\n\n` +
        `aₙ = a + (n - 1)d\n\n` +
        `${target} = ${first} + (n - 1)(${difference})\n\n` +
        `Solving gives n = ${n}.`
    ),

    learningObjective:
      "Work backwards from a sequence term to determine its position.",
  };
}

/* ---------- TWO-STAGE PROBABILITY ---------- */

function expertProbability() {
  const red =
    randomInt(4, 12);

  const blue =
    randomInt(4, 12);

  const total =
    red + blue;

  /*
    Probability of selecting
    two red balls without replacement.
  */

  const probability =
    (red / total) *
    ((red - 1) /
      (total - 1));

  const percentage =
    Math.round(
      probability * 10000
    ) / 100;

  const fractionNumerator =
    red * (red - 1);

  const fractionDenominator =
    total * (total - 1);

  return {
    topic: "Advanced Probability",

    question:
      `A bag contains ${red} red balls and ${blue} blue balls.\n\n` +
      `Two balls are selected one after another WITHOUT replacement.\n\n` +
      `What is the probability that both balls are red?`,

    ...makeMCQ(
      `${fractionNumerator}/${fractionDenominator} (${percentage}%)`,
      [
        `${red}/${total}`,
        `${red * red}/${total * total}`,
        `${red - 1}/${total}`,
      ],
      `First red:\n` +
        `P(R₁) = ${red}/${total}\n\n` +
        `After removing one red ball:\n` +
        `P(R₂|R₁) = ${red -
          1}/${total - 1}\n\n` +
        `Therefore:\n` +
        `P(both red) = ${red}/${total} × ${red -
          1}/${total - 1}\n` +
        `= ${fractionNumerator}/${fractionDenominator}\n` +
        `≈ ${percentage}%.`
    ),

    learningObjective:
      "Calculate compound probabilities without replacement.",
  };
}

/* ---------- PYTHAGORAS + REASONING ---------- */

function expertPythagoras() {
  const a =
    randomInt(10, 80);

  const b =
    randomInt(10, 80);

  const hypotenuse =
    Math.sqrt(
      a * a +
        b * b
    );

  const answer =
    Math.round(
      hypotenuse * 100
    ) / 100;

  return {
    topic: "Advanced Geometry",

    question:
      `A rectangular field has perpendicular sides of ${a} m and ${b} m.\n\n` +
      `A straight path is built from one corner to the opposite corner.\n\n` +
      `What is the length of the path?`,

    ...makeMCQ(
      `${fmt(answer)} m`,
      [
        `${fmt(a + b)} m`,
        `${fmt(
          Math.abs(a - b)
        )} m`,
        `${fmt(
          Math.sqrt(
            a * a +
              b
          )
        )} m`,
      ],
      `The diagonal forms a right-angled triangle.\n\n` +
        `Using Pythagoras:\n\n` +
        `c² = a² + b²\n\n` +
        `c² = ${a}² + ${b}²\n` +
        `c = √(${a * a +
          b * b})\n` +
        `c ≈ ${fmt(answer)} m.`
    ),

    learningObjective:
      "Apply Pythagoras' theorem to real-world geometry.",
  };
}

/* ---------- ADVANCED TRIGONOMETRY ---------- */

function expertTrigonometry() {
  const angle =
    randomItem([
      23,
      31,
      37,
      42,
      53,
      61,
      67,
    ]);

  const adjacent =
    randomInt(50, 500);

  const opposite =
    adjacent *
    Math.tan(
      (angle * Math.PI) /
        180
    );

  const hypotenuse =
    Math.sqrt(
      adjacent * adjacent +
        opposite * opposite
    );

  const answer =
    Math.round(
      hypotenuse * 100
    ) / 100;

  return {
    topic: "Advanced Trigonometry",

    question:
      `A right-angled triangle has an angle of ${angle}°.\n\n` +
      `The side adjacent to the angle is ${adjacent} cm.\n\n` +
      `First determine the opposite side using tangent, then use Pythagoras to determine the hypotenuse.\n\n` +
      `What is the hypotenuse?`,

    ...makeMCQ(
      `${fmt(answer)} cm`,
      [
        `${fmt(opposite)} cm`,
        `${fmt(
          adjacent +
            opposite
        )} cm`,
        `${fmt(
          Math.sqrt(
            adjacent *
              adjacent -
              opposite *
                opposite
          )
        )} cm`,
      ],
      `Step 1 — tangent:\n\n` +
        `tan(${angle}°) = opposite / ${adjacent}\n\n` +
        `opposite = ${adjacent} × tan(${angle}°)\n` +
        `≈ ${fmt(opposite)} cm\n\n` +
        `Step 2 — Pythagoras:\n\n` +
        `hypotenuse² = ${adjacent}² + ${fmt(
          opposite
        )}²\n\n` +
        `hypotenuse ≈ ${fmt(answer)} cm.`
    ),

    learningObjective:
      "Combine trigonometric ratios and Pythagoras' theorem.",
  };
}

/* ---------- COMPOSITE FUNCTIONS ---------- */

function expertFunctions() {
  const a =
    randomInt(2, 10);

  const b =
    randomInt(-20, 20);

  const c =
    randomInt(2, 10);

  const d =
    randomInt(-20, 20);

  const x =
    randomInt(-10, 10);

  const first =
    a * x + b;

  const answer =
    c * first + d;

  return {
    topic: "Advanced Functions",

    question:
      `Given:\n\n` +
      `f(x) = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(
        b
      )}\n\n` +
      `g(x) = ${c}x ${d >= 0 ? "+" : "-"} ${Math.abs(
        d
      )}\n\n` +
      `Calculate g(f(${x})).`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(answer, 20),
      `First calculate f(${x}):\n\n` +
        `f(${x}) = ${a}(${x}) ${b >= 0 ? "+" : "-"} ${Math.abs(
          b
        )}\n` +
        `= ${first}\n\n` +
        `Now substitute into g(x):\n\n` +
        `g(${first}) = ${c}(${first}) ${d >= 0 ? "+" : "-"} ${Math.abs(
          d
        )}\n` +
        `= ${answer}.`
    ),

    learningObjective:
      "Evaluate composite functions through sequential substitution.",
  };
}

/* ---------- EXPERT INDICES ---------- */

function expertIndices() {
  const base =
    randomInt(2, 8);

  const a =
    randomInt(2, 6);

  const b =
    randomInt(2, 5);

  const exponent =
    a * b;

  const answer =
    base ** exponent;

  return {
    topic: "Advanced Indices",

    question:
      `Simplify and evaluate:\n\n` +
      `(${base}^${a})^${b}`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(
        answer,
        Math.max(
          10,
          answer * 0.1
        )
      ),
      `Use the power-of-a-power law:\n\n` +
        `(aᵐ)ⁿ = aᵐⁿ\n\n` +
        `Therefore:\n` +
        `(${base}^${a})^${b} = ${base}^(${a} × ${b})\n` +
        `= ${base}^${exponent}\n` +
        `= ${answer}.`
    ),

    learningObjective:
      "Apply laws of indices involving powers of powers.",
  };
}

/* ---------- EXPERT LOGARITHMS ---------- */

function expertLogarithms() {
  const base =
    randomItem([
      2,
      3,
      5,
      10,
    ]);

  const x =
    randomInt(2, 8);

  const y =
    randomInt(1, 5);

  /*
    log_base(base^x * base^y)
    = x + y
  */

  const answer =
    x + y;

  return {
    topic: "Advanced Logarithms",

    question:
      `Evaluate:\n\n` +
      `log₍${base}₎(${base}^${x} × ${base}^${y})`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(answer, 4),
      `Use:\n\n` +
        `logₐ(mn) = logₐ(m) + logₐ(n)\n\n` +
        `Therefore:\n` +
        `log₍${base}₎(${base}^${x}) + log₍${base}₎(${base}^${y})\n` +
        `= ${x} + ${y}\n` +
        `= ${answer}.`
    ),

    learningObjective:
      "Apply logarithm laws to simplify expressions.",
  };
}

/* ---------- EXPERT STATISTICS ---------- */

function expertStatistics() {
  const count = 8;

  const numbers =
    Array.from(
      { length: count },
      () =>
        randomInt(20, 100)
    );

  const total =
    numbers.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  const missing =
    randomInt(20, 100);

  const targetMean =
    randomInt(60, 100);

  const requiredTotal =
    targetMean *
    (count + 1);

  const answer =
    requiredTotal -
    total;

  return {
    topic: "Advanced Statistics",

    question:
      `Eight students have test scores:\n\n` +
      `${numbers.join(", ")}\n\n` +
      `A ninth student's score is unknown.\n\n` +
      `The mean score for all nine students is ${targetMean}.\n\n` +
      `What must the ninth student's score be?`,

    ...makeMCQ(
      fmt(answer),
      numericOptions(answer, 10),
      `The total required for a mean of ${targetMean} is:\n\n` +
        `${targetMean} × 9 = ${requiredTotal}\n\n` +
        `The known scores total:\n\n` +
        `${total}\n\n` +
        `Therefore the missing score is:\n\n` +
        `${requiredTotal} - ${total} = ${answer}.`
    ),

    learningObjective:
      "Use the relationship between mean, total and number of observations.",
  };
}

/* ---------- EXPERT SCIENCE-MATH HYBRID ---------- */

function expertPhysicsWork() {
  const mass =
    randomInt(5, 80);

  const acceleration =
    randomInt(3, 20);

  const distance =
    randomInt(20, 200);

  const force =
    mass *
    acceleration;

  const work =
    force *
    distance;

  return {
    topic: "Work and Energy",

    question:
      `An object of mass ${mass} kg accelerates at ${acceleration} m/s² over a distance of ${distance} m.\n\n` +
      `Assuming the resultant force is constant and acts in the direction of motion, calculate the work done.`,

    ...makeMCQ(
      `${work} J`,
      [
        `${force} J`,
        `${mass *
          distance} J`,
        `${acceleration *
          distance} J`,
      ],
      `First use Newton's second law:\n\n` +
        `F = ma\n` +
        `F = ${mass} × ${acceleration}\n` +
        `F = ${force} N\n\n` +
        `Then:\n\n` +
        `W = Fd\n` +
        `W = ${force} × ${distance}\n` +
        `W = ${work} J.`
    ),

    learningObjective:
      "Combine Newton's second law with the work equation.",
  };
}

/* ---------- EXPERT QUESTION SELECTOR ---------- */

function generateExpertMath(topic) {
  const t =
    String(topic || "")
      .toLowerCase();

  /*
    Topic-specific Expert generators.
  */

  if (t.includes("linear") || t.includes("algebra")) {
    return randomItem([
      expertMultiStepAlgebra,
      expertFractionEquation,
    ])();
  }

  if (t.includes("quadratic")) {
    return expertQuadraticReasoning();
  }

  if (t.includes("percent")) {
    return expertCompoundPercentage();
  }

  if (t.includes("ratio")) {
    return expertRatioReasoning();
  }

  if (t.includes("probability")) {
    return expertProbability();
  }

  if (
    t.includes("sequence")
  ) {
    return expertSequence();
  }

  if (
    t.includes("trigonometry") ||
    t.includes("trig")
  ) {
    return expertTrigonometry();
  }

  if (
    t.includes("function")
  ) {
    return expertFunctions();
  }

  if (
    t.includes("index") ||
    t.includes("exponent")
  ) {
    return expertIndices();
  }

  if (
    t.includes("log")
  ) {
    return expertLogarithms();
  }

  if (
    t.includes("statistic")
  ) {
    return expertStatistics();
  }
   if (
    t.includes("geometry") ||
    t.includes("pythag")
  ) {
    return expertPythagoras();
  }

  /*
    Broad Expert Mathematics:
    randomly select from genuinely
    multi-step generators.
  */

  return randomItem([
    expertMultiStepAlgebra,
    expertFractionEquation,
    expertQuadraticReasoning,
    expertCompoundPercentage,
    expertRatioReasoning,
    expertSequence,
    expertProbability,
    expertPythagoras,
    expertTrigonometry,
    expertFunctions,
    expertIndices,
    expertLogarithms,
    expertStatistics,
  ])();
}

/* ========================================================
   SCIENCE QUESTION GENERATORS
======================================================== */

/*
   These are concept pools rather than fixed questions.
   Difficulty modifies the reasoning level.
*/

const scienceBanks = {
  Biology: {
    "Cell Biology": [
      {
        q: "A plant cell is placed in a concentrated salt solution. What is most likely to happen?",
        a: "Water leaves the cell by osmosis",
        o: [
          "Water enters the cell rapidly",
          "The nucleus immediately disappears",
          "The cell produces more glucose",
        ],
        e: "The surrounding solution has a lower water potential, so water moves out through the partially permeable membrane."
      },
      {
        q: "Which organelle is primarily responsible for aerobic respiration?",
        a: "Mitochondrion",
        o: [
          "Ribosome",
          "Golgi apparatus",
          "Chloroplast",
        ],
        e: "Mitochondria are the main sites of aerobic respiration and ATP production."
      },
    ],

    Genetics: [
      {
        q: "Two heterozygous parents have genotype Aa. What is the probability of an offspring being aa?",
        a: "25%",
        o: [
          "0%",
          "50%",
          "75%",
        ],
        e: "Aa × Aa produces AA, Aa, Aa and aa. Therefore one out of four offspring is expected to be aa."
      },
      {
        q: "What is the main role of DNA in a cell?",
        a: "Store genetic information",
        o: [
          "Produce ATP directly",
          "Digest food",
          "Transport oxygen",
        ],
        e: "DNA stores the genetic information used to control cellular processes and protein production."
      },
    ],

    "Human Biology": [
      {
        q: "Why does heart rate increase during vigorous exercise?",
        a: "To increase blood flow and oxygen delivery to working muscles",
        o: [
          "To stop cellular respiration",
          "To reduce oxygen delivery",
          "To prevent glucose from entering cells",
        ],
        e: "Working muscles require more oxygen and nutrients, so increased cardiac output helps meet their demand."
      },
    ],

    Photosynthesis: [
      {
        q: "Which factor can limit photosynthesis when light intensity is very low?",
        a: "Light intensity",
        o: [
          "Blood pressure",
          "Muscle contraction",
          "Bone density",
        ],
        e: "Low light provides insufficient energy for the light-dependent reactions of photosynthesis."
      },
    ],

    Ecology: [
      {
        q: "Why does energy decrease between trophic levels?",
        a: "Energy is lost through respiration, heat and uneaten material",
        o: [
          "Energy is created by predators",
          "Consumers require no energy",
          "Plants destroy all energy",
        ],
        e: "Energy transfer between trophic levels is inefficient because energy is lost through respiration, heat, movement and waste."
      },
    ],

    Evolution: [
      {
        q: "Natural selection can increase the frequency of a trait when the trait:",
        a: "Provides an advantage that increases reproductive success",
        o: [
          "Always harms survival",
          "Prevents reproduction",
          "Appears only because organisms need it",
        ],
        e: "Individuals with advantageous heritable traits are more likely to survive and reproduce."
      },
    ],

    Respiration: [
      {
        q: "What is the main purpose of aerobic respiration?",
        a: "Release usable energy from glucose",
        o: [
          "Produce DNA",
          "Destroy oxygen",
          "Stop ATP production",
        ],
        e: "Aerobic respiration transfers energy from glucose into ATP, which cells can use."
      },
    ],
  },

  Physics: {
    Motion: [
      {
        q: "A car changes velocity from 12 m/s to 42 m/s in 5 s. What is its average acceleration?",
        a: "6 m/s²",
        o: [
          "4 m/s²",
          "8 m/s²",
          "10 m/s²",
        ],
        e: "Acceleration = change in velocity ÷ time = (42 − 12) ÷ 5 = 6 m/s²."
      },
    ],

    Electricity: [
      {
        q: "A 6 Ω resistor carries a current of 2 A. What is the potential difference?",
        a: "12 V",
        o: [
          "3 V",
          "8 V",
          "18 V",
        ],
        e: "Using V = IR, V = 2 × 6 = 12 V."
      },
    ],

    Energy: [
      {
        q: "A 2 kg object moves at 10 m/s. What is its kinetic energy?",
        a: "100 J",
        o: [
          "20 J",
          "50 J",
          "200 J",
        ],
        e: "KE = ½mv² = ½ × 2 × 10² = 100 J."
      },
    ],

    Waves: [
      {
        q: "A wave has a frequency of 5 Hz and wavelength of 2 m. What is its speed?",
        a: "10 m/s",
        o: [
          "2.5 m/s",
          "7 m/s",
          "25 m/s",
        ],
        e: "Wave speed = frequency × wavelength = 5 × 2 = 10 m/s."
      },
    ],

    Forces: [
      {
        q: "What happens to the acceleration of an object if the resultant force doubles while mass remains constant?",
        a: "The acceleration doubles",
        o: [
          "The acceleration halves",
          "The acceleration becomes zero",
          "The mass doubles",
        ],
        e: "From F = ma, with constant mass, acceleration is directly proportional to resultant force."
      },
    ],

    Momentum: [
      {
        q: "Why is momentum conserved in an isolated collision?",
        a: "There is no resultant external force on the system",
        o: [
          "Objects have no mass",
          "Energy disappears",
          "Velocity is always zero",
        ],
        e: "In an isolated system, external forces do not change the total momentum."
      },
    ],
  },

  Chemistry: {
    "Atomic Structure": [
      {
        q: "An atom has 17 protons and 18 neutrons. What are its atomic number and mass number?",
        a: "17 and 35",
        o: [
          "18 and 35",
          "17 and 18",
          "35 and 17",
        ],
        e: "Atomic number equals proton number. Mass number equals protons plus neutrons."
      },
    ],

    Moles: [
      {
        q: "How many moles are present in 18 g of water if Mr(H₂O) = 18?",
        a: "1 mol",
        o: [
          "0.5 mol",
          "2 mol",
          "18 mol",
        ],
        e: "Moles = mass ÷ molar mass = 18 ÷ 18 = 1 mol."
      },
    ],

    "Acids and Bases": [
      {
        q: "A solution has a pH of 2. Which description is correct?",
        a: "Strongly acidic",
        o: [
          "Neutral",
          "Weakly alkaline",
          "Strongly alkaline",
        ],
        e: "A pH of 2 is far below 7 and therefore indicates a strongly acidic solution."
      },
    ],

    "Chemical Reactions": [
      {
        q: "Why does increasing temperature usually increase reaction rate?",
        a: "More particles have enough energy for successful collisions",
        o: [
          "Particles stop moving",
          "Activation energy becomes zero",
          "Reactants cannot collide",
        ],
        e: "Higher temperature increases kinetic energy, increasing the frequency of successful collisions."
      },
    ],

    "Chemical Bonding": [
      {
        q: "What type of bonding involves electrostatic attraction between oppositely charged ions?",
        a: "Ionic bonding",
        o: [
          "Metallic bonding",
          "Hydrogen bonding",
          "Van der Waals bonding",
        ],
        e: "Ionic bonding results from electrostatic attraction between oppositely charged ions."
      },
    ],

    Electrochemistry: [
      {
        q: "At which electrode does oxidation occur?",
        a: "Anode",
        o: [
          "Cathode",
          "Electrolyte",
          "Salt bridge",
        ],
        e: "Oxidation occurs at the anode. A useful mnemonic is OIL: Oxidation Is Loss of electrons."
      },
    ],
  },
};

/* ========================================================
   ADVANCED SCIENCE CALCULATIONS
======================================================== */

function advancedPhysics(
  topic,
  difficulty
) {
  const level =
    difficulty === "Expert"
      ? 100
      : difficulty === "Hard"
      ? 50
      : 20;

  if (
    topic.toLowerCase().includes("motion")
  ) {
    const u = randomInt(
      level,
      level * 5
    );

    const acceleration =
      randomInt(
        5,
        difficulty === "Expert"
          ? 80
          : 20
      );

    const time =
      randomInt(
        5,
        difficulty === "Expert"
          ? 60
          : 20
      );

    const v =
      u +
      acceleration * time;

    return {
      topic: "Motion",

      question:
        `An object moves with an initial velocity of ${u} m/s and accelerates uniformly at ${acceleration} m/s² for ${time} seconds.\n\n` +
        `Calculate its final velocity.`,

      ...makeMCQ(
        `${v} m/s`,
        [
          `${v + acceleration} m/s`,
          `${Math.max(
            0,
            v - acceleration
          )} m/s`,
          `${u + time} m/s`,
        ],
        `Using v = u + at:\n\n` +
          `v = ${u} + (${acceleration} × ${time})\n` +
          `v = ${v} m/s.`
      ),

      learningObjective:
        "Apply SUVAT equations to uniformly accelerated motion.",
    };
  }

  if (
    topic.toLowerCase().includes("energy")
  ) {
    const mass =
      difficulty === "Expert"
        ? randomInt(20, 500)
        : randomInt(2, 50);

    const velocity =
      difficulty === "Expert"
        ? randomInt(20, 150)
        : randomInt(5, 40);

    const energy =
      0.5 *
      mass *
      velocity *
      velocity;

    return {
      topic: "Energy",

      question:
        `An object of mass ${mass} kg travels at ${velocity} m/s.\n\n` +
        `Calculate its kinetic energy.`,

      ...makeMCQ(
        `${fmt(energy)} J`,
        [
          `${fmt(
            mass * velocity
          )} J`,
          `${fmt(
            mass *
              velocity *
              velocity
          )} J`,
          `${fmt(
            0.25 *
              mass *
              velocity *
              velocity
          )} J`,
        ],
        `KE = ½mv²\n\n` +
          `= ½ × ${mass} × ${velocity}²\n` +
          `= ${fmt(energy)} J.`
      ),

      learningObjective:
        "Calculate kinetic energy using KE = ½mv².",
    };
  }

  return null;
}

function advancedChemistry(
  topic,
  difficulty
) {
  if (
    topic.toLowerCase().includes("mole")
  ) {
    const moles =
      difficulty === "Expert"
        ? randomInt(20, 500)
        : randomInt(2, 50);

    const molarMass =
      randomInt(20, 250);

    const mass =
      moles * molarMass;

    return {
      topic: "Moles",

      question:
        `A substance has a molar mass of ${molarMass} g/mol.\n\n` +
        `How much mass is present in ${moles} mol?`,

      ...makeMCQ(
        `${mass} g`,
        numericOptions(
          mass,
          Math.max(
            20,
            Math.round(
              mass * 0.1
            )
          )
        ),
        `Mass = moles × molar mass.\n\n` +
          `= ${moles} × ${molarMass}\n` +
          `= ${mass} g.`
      ),

      learningObjective:
        "Use the mole relationship between mass and molar mass.",
    };
  }

  return null;
} 
/* ========================================================
   SCIENCE GENERATOR
======================================================== */

function generateScience(
  subject,
  topic,
  difficulty,
  level
) {
  /*
  ========================================================
   LEVEL + DIFFICULTY AWARE SCIENCE GENERATION
  ========================================================
  */

  const currentLevel =
    String(level || "SHS")
      .toLowerCase();

  const currentDifficulty =
    String(difficulty || "Medium");

  /*
  ========================================================
   ADVANCED CALCULATIONS
  ========================================================
  */

  if (subject === "Physics") {
    const advanced =
      advancedPhysics(
        topic,
        currentDifficulty
      );

    if (advanced) {
      return advanced;
    }
  }

  if (subject === "Chemistry") {
    const advanced =
      advancedChemistry(
        topic,
        currentDifficulty
      );

    if (advanced) {
      return advanced;
    }
  }

  /*
  ========================================================
   FIND TOPIC POOL
  ========================================================
  */

  const subjectBank =
    scienceBanks[subject];

  if (!subjectBank) {
    return null;
  }

  let pool =
    subjectBank[topic];

  /*
    If the exact topic isn't available,
    search for a matching topic name.
  */

  if (!pool) {
    const topicKey =
      String(topic || "")
        .toLowerCase();

    const matchingTopic =
      Object.keys(subjectBank)
        .find((key) =>
          key
            .toLowerCase()
            .includes(topicKey) ||
          topicKey.includes(
            key.toLowerCase()
          )
        );

    if (matchingTopic) {
      pool =
        subjectBank[
          matchingTopic
        ];
    }
  }

  /*
    Final fallback:
    use every question belonging
    to the selected science subject.
  */

  if (!pool) {
    pool =
      Object.values(
        subjectBank
      ).flat();
  }

  if (
    !Array.isArray(pool) ||
    pool.length === 0
  ) {
    return null;
  }

  /*
  ========================================================
   SELECT A BASE CONCEPT
  ========================================================
  */

  const base =
    randomItem(pool);

  if (!base) {
    return null;
  }

  let question =
    base.q;

  let explanation =
    base.e;

  /*
  ========================================================
   LEVEL-AWARE FRAMING
  ========================================================
  */

  const isJHS =
    currentLevel.includes("jhs") ||
    currentLevel.includes("junior") ||
    currentLevel.includes("basic") ||
    currentLevel.includes("middle");

  const isUniversity =
    currentLevel.includes(
      "university"
    ) ||
    currentLevel.includes(
      "tertiary"
    ) ||
    currentLevel.includes(
      "college"
    );

  /*
    JHS:
    Keep the scientific concept accessible,
    but don't remove reasoning.
  */

  if (isJHS) {
    if (
      currentDifficulty === "Hard" ||
      currentDifficulty === "Expert"
    ) {
      question =
        `A student is investigating the following scientific situation.\n\n` +
        `${question}\n\n` +
        `Which conclusion is best supported by the evidence or scientific principle involved?`;

      explanation +=
        `\n\nFor this level, focus on identifying the scientific principle involved and then applying it to the situation.`;
    }
  }

  /*
    SHS:
    Introduce stronger application and
    interpretation.
  */

  else if (
    !isUniversity
  ) {
    if (
      currentDifficulty === "Hard"
    ) {
      question =
        `A senior secondary student is analysing the following situation.\n\n` +
        `${question}\n\n` +
        `Which conclusion is most scientifically justified?`;

      explanation +=
        `\n\nAt this difficulty, do not rely only on memorisation. Identify the underlying principle and apply it to the situation.`;
    }

    if (
      currentDifficulty === "Expert"
    ) {
      question =
        `EXPERT SCIENTIFIC ANALYSIS\n\n` +
        `A student must evaluate the following situation using scientific reasoning rather than simple recall.\n\n` +
        `${question}\n\n` +
        `Which conclusion is most scientifically defensible?`;

      explanation +=
        `\n\nExpert questions require you to identify the relevant principle, determine how it applies to the situation, and reject conclusions based on common misconceptions.`;
    }
  }

  /*
    UNIVERSITY:
    Push interpretation and mechanism.
  */

  else {
    question =
      `UNIVERSITY-LEVEL ANALYSIS\n\n` +
      `Consider the following scientific problem:\n\n` +
      `${question}\n\n` +
      `Which conclusion is most scientifically defensible based on the underlying mechanism?`;

    explanation +=
      `\n\nAt university level, focus on the mechanism behind the result rather than relying on memorised definitions. Consider what must be true, what assumptions are being made, and why the alternative conclusions fail.`;
  }

  /*
  ========================================================
   RETURN QUESTION
  ========================================================
  */

  return {
    topic:
      topic ||
      "General Science",

    question,

    ...makeMCQ(
      base.a,
      base.o,
      explanation
    ),

    learningObjective:
      "Apply scientific knowledge, identify the relevant principle, and justify the scientifically supported conclusion.",
  };
}

/* ========================================================
   MATH ROUTER
======================================================== */

function generateMath(
  topic,
  difficulty,
  level
) {
  const t =
    String(topic || "")
      .toLowerCase();

  const currentLevel =
    String(level || "SHS")
      .toLowerCase();

  /*
  ========================================================
   LEVEL-AWARE MATHEMATICS ROUTING
  ========================================================
  */

  /*
   UNIVERSITY
   -------------------------------------------------------
   University questions should favour deeper mathematical
   reasoning instead of simply increasing the numbers.
  */

  if (
    currentLevel.includes("university") ||
    currentLevel.includes("tertiary") ||
    currentLevel.includes("college")
  ) {
    if (
      t.includes("linear") ||
      t.includes("equation") ||
      t.includes("algebra")
    ) {
      return linearEquation(
        difficulty
      );
    }

    if (
      t.includes("simultaneous") ||
      t.includes("system")
    ) {
      return simultaneousEquations(
        difficulty
      );
    }

    if (
      t.includes("quadratic")
    ) {
      return quadratic(
        difficulty
      );
    }

    if (
      t.includes("percentage") ||
      t.includes("percent")
    ) {
      return percentage(
        difficulty
      );
    }

    if (
      t.includes("ratio") ||
      t.includes("proportion")
    ) {
      return ratio(
        difficulty
      );
    }

    if (
      t.includes("probability")
    ) {
      return probability(
        difficulty
      );
    }

    if (
      t.includes("trigonometry") ||
      t.includes("trig")
    ) {
      return trigonometry(
        difficulty
      );
    }

    if (
      t.includes("indices") ||
      t.includes("index") ||
      t.includes("exponent")
    ) {
      return indices(
        difficulty
      );
    }

    if (
      t.includes("log")
    ) {
      return logarithms(
        difficulty
      );
    }

    if (
      t.includes("sequence")
    ) {
      return sequences(
        difficulty
      );
    }

    if (
      t.includes("statistics") ||
      t.includes("statistic")
    ) {
      return statistics(
        difficulty
      );
    }

    if (
      t.includes("function")
    ) {
      return functions(
        difficulty
      );
    }

    if (
      t.includes("geometry") ||
      t.includes("area") ||
      t.includes("perimeter")
    ) {
      return geometry(
        difficulty
      );
    }

    /*
      If the requested university topic
      is not yet represented by a
      dedicated generator, use the
      strongest general algebraic
      generator rather than failing.
    */

    return linearEquation(
      difficulty
    );
  }

  /*
  ========================================================
   JHS
  ========================================================
  */

  if (
    currentLevel.includes("jhs") ||
    currentLevel.includes("junior") ||
    currentLevel.includes("basic") ||
    currentLevel.includes("middle")
  ) {
    /*
      JHS should focus on foundational
      mathematical reasoning.
    */

    if (
      t.includes("linear") ||
      t.includes("equation") ||
      t.includes("algebra")
    ) {
      return linearEquation(
        difficulty
      );
    }

    if (
      t.includes("percentage") ||
      t.includes("percent")
    ) {
      return percentage(
        difficulty
      );
    }

    if (
      t.includes("ratio") ||
      t.includes("proportion")
    ) {
      return ratio(
        difficulty
      );
    }

    if (
      t.includes("probability")
    ) {
      return probability(
        difficulty
      );
    }

    if (
      t.includes("statistics") ||
      t.includes("mean") ||
      t.includes("average")
    ) {
      return statistics(
        difficulty
      );
    }

    if (
      t.includes("geometry") ||
      t.includes("area") ||
      t.includes("perimeter")
    ) {
      return geometry(
        difficulty
      );
    }

    /*
      Some JHS systems may still request
      topics such as indices or sequences.
      They are allowed, but remain within
      the existing generator framework.
    */

    if (
      t.includes("indices") ||
      t.includes("index") ||
      t.includes("exponent")
    ) {
      return indices(
        difficulty
      );
    }

    if (
      t.includes("sequence")
    ) {
      return sequences(
        difficulty
      );
    }

    /*
      JHS fallback.
    */

    return linearEquation(
      difficulty
    );
  }

  /*
  ========================================================
   SHS
  ========================================================
  */

  if (
    t.includes("simultaneous")
  ) {
    return simultaneousEquations(
      difficulty
    );
  }

  if (
    t.includes("quadratic")
  ) {
    return quadratic(
      difficulty
    );
  }

  if (
    t.includes("percent")
  ) {
    return percentage(
      difficulty
    );
  }

  if (
    t.includes("ratio")
  ) {
    return ratio(
      difficulty
    );
  }

  if (
    t.includes("probability")
  ) {
    return probability(
      difficulty
    );
  }

  if (
    t.includes("trigonometry") ||
    t.includes("trig")
  ) {
    return trigonometry(
      difficulty
    );
  }

  if (
    t.includes("indices") ||
    t.includes("index") ||
    t.includes("exponent")
  ) {
    return indices(
      difficulty
    );
  }

  if (
    t.includes("log")
  ) {
    return logarithms(
      difficulty
    );
  }

  if (
    t.includes("sequence")
  ) {
    return sequences(
      difficulty
    );
  }

  if (
    t.includes("statistics") ||
    t.includes("statistic")
  ) {
    return statistics(
      difficulty
    );
  }

  if (
    t.includes("function")
  ) {
    return functions(
      difficulty
    );
  }

  if (
    t.includes("geometry") ||
    t.includes("area") ||
    t.includes("perimeter")
  ) {
    return geometry(
      difficulty
    );
  }

  /*
    General algebra fallback.
  */

  return linearEquation(
    difficulty
  );
}

/* ========================================================
   TRUE / FALSE GENERATOR
======================================================== */

function convertToTrueFalse(
  question
) {
  const makeTrue =
    Math.random() > 0.5;

  if (makeTrue) {
    return {
      ...question,

      question:
        `True or False?\n\n${question.question}\n\n` +
        `The statement above is correctly represented by the answer: ${question.answer}.`,

      options: [
        "True",
        "False",
      ],

      answer: "True",

      questionType:
        "True / False",
    };
  }

  /*
    Create a deliberately incorrect
    numerical or conceptual answer.
  */

  let falseAnswer;

  if (
    question.options &&
    question.options.length > 1
  ) {
    const alternatives =
      question.options.filter(
        (option) =>
          option !==
          question.answer
      );

    falseAnswer =
      randomItem(
        alternatives
      );
  } else {
    falseAnswer =
      "the opposite result";
  }

  return {
    ...question,

    question:
      `True or False?\n\n${question.question}\n\n` +
      `The answer is ${falseAnswer}.`,

    options: [
      "True",
      "False",
    ],

    answer: "False",

    questionType:
      "True / False",

    explanation:
      `${question.explanation}\n\n` +
      `The proposed answer "${falseAnswer}" is incorrect; the correct answer is "${question.answer}".`,
  };
}

/* ========================================================
   PROBLEM SOLVING
======================================================== */

function convertToProblemSolving(
  question
) {
  return {
    ...question,

    question:
      `PROBLEM SOLVING\n\n` +
      `${question.question}\n\n` +
      `Solve the problem carefully. You may show your working on paper.\n\n` +
      `FINAL ANSWER: Enter only your final answer below.`,

    options: [],

    questionType:
      "Problem Solving",
  };
}

/* ========================================================
   WORD PROBLEM
======================================================== */

function convertToWordProblem(
  question
) {
  const scenarios = [
    "A student is preparing for an examination and encounters the following situation:",
    "A school laboratory records the following situation:",
    "An engineer is analysing the following situation:",
    "A science student is investigating the following situation:",
    "A teacher gives a student the following real-world problem:",
  ];

  return {
    ...question,

    question:
      `${randomItem(
        scenarios
      )}\n\n` +
      `${question.question}\n\n` +
      `Determine the required answer and explain the method you used.`,

    options: [],

    questionType:
      "Word Problems",
  };
}

/* ========================================================
   QUESTION TYPE ROUTER
======================================================== */

function convertQuestion(
  question,
  questionType
) {
  const type =
    String(
      questionType ||
        "Multiple Choice"
    ).toLowerCase();

  if (
    type.includes("true") ||
    type.includes("false")
  ) {
    return convertToTrueFalse(
      question
    );
  }

  if (
    type.includes("problem") &&
    !type.includes("word")
  ) {
    return convertToProblemSolving(
      question
    );
  }

  if (
    type.includes("word")
  ) {
    return convertToWordProblem(
      question
    );
  }

  return {
    ...question,
    questionType:
      "Multiple Choice",
  };
}
/* ========================================================
   MAIN GENERATOR
======================================================== */

function generateQuestions({ subject, topic, level, grade, difficulty, questionType, count }) {
  const requestedCount = Math.min(Math.max(Number.parseInt(count, 10) || 5, 1), 50);
  const normalizedGrade = normalizeGrade(grade || level);
  const normalizedSubject = normalizeSubject(subject);
  const validation = validateRequest({ grade: normalizedGrade, subject: normalizedSubject, topic });
  if (!validation.valid) throw new Error(validation.message || "Invalid curriculum request.");
  const results = [];
  const seen = new Set();
  const maxAttempts = Math.max(1500, requestedCount * 400);
  let attempts = 0;
  let textbook = { available: false, grounded: false, learningObjectives: [] };
  try { textbook = getKnowledgeContext({ grade: normalizedGrade, subject: normalizedSubject, topic }); } catch (_) {}
  while (results.length < requestedCount && attempts < maxAttempts) {
    attempts++;
    let q;
    try { q = normalizedSubject === "Mathematics" ? generateMath(topic, difficulty, normalizedGrade) : generateScience(normalizedSubject, topic, difficulty, normalizedGrade); } catch (_) { continue; }
    if (!q) continue;
    const type = String(questionType || "Multiple Choice");
    q = type.toLowerCase() === "mixed" ? transformQuestion(q, makeMixedType(results.length)) : transformQuestion(q, type);
    q = { ...q, id: makeId(), subject: normalizedSubject, grade: normalizedGrade, level: normalizedGrade, difficulty, topic: q.topic || topic, textbookAvailable: Boolean(textbook.available), textbookGrounded: Boolean(textbook.grounded) };
    if (textbook.learningObjectives?.length) q.learningObjective = textbook.learningObjectives[0];
    const check = validateQuestion(q);
    if (!check.valid) continue;
    const sig = signature(q.question);
    if (seen.has(sig)) continue;
    seen.add(sig);
    results.push(q);
  }
  if (results.length !== requestedCount) throw new Error("Unable to generate the requested " + requestedCount + " unique questions for " + normalizedGrade + " " + normalizedSubject + " / " + topic + ". Generated " + results.length + ".");
  return results;
}

/* ========================================================
   EXPORT
======================================================== */

module.exports = {
  generateQuestions,
};