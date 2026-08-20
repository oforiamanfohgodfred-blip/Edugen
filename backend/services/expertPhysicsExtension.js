const crypto = require("crypto");

const id = () => crypto.randomBytes(8).toString("hex");

function make({ grade, topic, family, question, answer, distractors, explanation, steps = 5 }) {
  return {
    id: id(),
    subject: "Physics",
    grade,
    level: grade,
    topic,
    difficulty: "Expert",
    questionFamily: `expert-physics-${family}`,
    questionType: "Multiple Choice",
    question,
    options: [answer, ...distractors],
    answer,
    correctAnswer: answer,
    explanation,
    learningObjective: `Analyze, model, evaluate evidence and justify conclusions in ${topic}.`,
    reasoningSteps: Math.max(5, steps),
    expertReasoning: true,
  };
}

function generateExpertPhysicsQuestion({ grade, topic, variationIndex = 0 }) {
  const families = [
    make({
      grade, topic, family: "dimensional-model-check",
      question: `A proposed relationship for a physical quantity in ${topic} has the correct numerical trend but may contain an incorrect combination of units. Before using experimental data to estimate the constant, what should an expert establish?`,
      answer: "Check dimensional consistency first, identify the physical quantities and assumptions in the model, then determine whether the data can legitimately estimate the remaining constant.",
      distractors: ["Fit the numbers first because units can be adjusted afterward.", "Accept the equation if it gives values close to the measurements.", "Use the largest measured value as the constant without checking the model."],
      explanation: "Dimensional consistency is a necessary structural check before numerical fitting; agreement alone cannot validate an incorrectly formed model."
    }),
    make({
      grade, topic, family: "uncertainty-inference",
      question: `Two measurements in ${topic} differ slightly. Their uncertainty intervals overlap, but a student claims the second value is definitely larger. What should an expert do before accepting that conclusion?`,
      answer: "Compare the difference with the combined uncertainty, determine whether the intervals meaningfully separate the measurements, and avoid claiming a distinction that the precision cannot support.",
      distractors: ["Accept the larger central value as proof.", "Ignore uncertainty because the instruments produced numerical readings.", "Average the two values and call the average the proven result."],
      explanation: "A difference between measured central values is not automatically significant when measurement uncertainty overlaps."
    }),
    make({
      grade, topic, family: "force-energy-crosscheck",
      question: `A ${topic} problem can be solved using either a force-based model or an energy-based model. The two approaches give different predictions. Which sequence gives the strongest diagnosis?`,
      answer: "Check the system boundary and assumptions in both models, identify omitted forces or energy transfers, then determine which conservation or force relation applies under the stated conditions.",
      distractors: ["Choose whichever method produces the smaller answer.", "Assume both methods must agree even if their system boundaries differ.", "Average the two predictions to obtain the physical answer."],
      explanation: "Different methods should agree only when they model the same system with compatible assumptions; disagreement is evidence to inspect the model."
    }),
    make({
      grade, topic, family: "graph-model-selection",
      question: `Experimental data for ${topic} can be represented by two graphs. One looks more linear, but the other follows the theoretical variables more directly. What should determine which graph is used to test the model?`,
      answer: "Choose the transformation predicted by the physical model, then examine linearity, residual behaviour and uncertainty rather than choosing solely by visual appearance.",
      distractors: ["Always choose the graph with the straightest appearance.", "Choose the graph with the steepest slope.", "Choose whichever graph has more plotted points."],
      explanation: "A valid linearisation comes from the model and should be evaluated with residuals and uncertainty, not appearance alone."
    }),
    make({
      grade, topic, family: "limiting-case-reasoning",
      question: `A model for ${topic} predicts a complicated result. An expert wants to know whether the model behaves sensibly before trusting its numerical output. Which test is most informative?`,
      answer: "Examine limiting cases and extreme but physically meaningful conditions, checking whether the model approaches results required by established principles.",
      distractors: ["Test only the exact values used in the original calculation.", "Assume the model is correct because its algebra is long.", "Change several parameters randomly until a convenient answer appears."],
      explanation: "Limiting-case analysis exposes hidden assumptions and impossible behaviour that a single numerical test can miss."
    })
  ];

  return families[((Number(variationIndex) || 0) % families.length + families.length) % families.length];
}

module.exports = { generateExpertPhysicsQuestion };
