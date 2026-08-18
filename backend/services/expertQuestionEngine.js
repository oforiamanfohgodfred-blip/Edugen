/* =========================================================
   EduGen EXPERT REASONING ENGINE
   ---------------------------------------------------------
   Expert is deliberately different from ordinary difficulty.
   Every Expert question must require:
   1) identifying the governing idea,
   2) connecting at least two pieces of evidence/logic,
   3) evaluating a consequence, exception, or alternative,
   4) selecting the final conclusion.

   This layer is concept-first, not number-first, and works
   without textbooks. Textbooks can later improve grounding.
========================================================= */

const crypto = require("crypto");

const makeId = () => crypto.randomBytes(8).toString("hex");
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function makeQuestion({ subject, grade, topic, question, answer, distractors, family, explanation, objective }) {
  return {
    id: makeId(),
    subject,
    grade,
    level: grade,
    topic,
    difficulty: "Expert",
    questionFamily: `expert-${family}`,
    questionType: "Multiple Choice",
    question,
    options: [answer, ...distractors],
    answer,
    correctAnswer: answer,
    explanation,
    learningObjective: objective || `Analyse, connect and evaluate ideas in ${topic}.`,
    reasoningSteps: 3,
    expertReasoning: true,
  };
}

const mathTemplates = [
  ({ topic, grade }) => makeQuestion({
    subject: "Mathematics", grade, topic, family: "proof-and-counterexample",
    question: `An advanced learner claims that a rule discovered while working with ${topic} must work in both directions. Before accepting the claim, you must identify the rule, determine which assumptions made the original direction valid, and then test whether reversing the logic preserves those assumptions. Which conclusion is mathematically strongest?`,
    answer: "The reverse statement is valid only when its necessary conditions have also been established.",
    distractors: ["A statement is reversible whenever it works for several examples.", "A reverse statement is always true because the original statement was proved.", "A reverse statement can be accepted without checking the original assumptions."],
    explanation: `Expert reasoning in ${topic} requires separating a valid implication from its converse and checking the conditions that make the reasoning work.`,
  }),
  ({ topic, grade }) => makeQuestion({
    subject: "Mathematics", grade, topic, family: "error-analysis",
    question: `Two students solve a difficult ${topic} problem. Student A reaches a plausible result by applying a familiar rule immediately. Student B first identifies the structure of the problem, states the condition under which the rule is valid, applies it, and then checks the result against the original conditions. Which approach gives the stronger mathematical justification?`,
    answer: "Student B, because the method is justified by conditions and verified against the original problem.",
    distractors: ["Student A, because a familiar rule never needs its conditions checked.", "Both methods are equally justified whenever the final answer looks reasonable.", "Neither method is useful because mathematical answers cannot be checked."],
    explanation: `A high-level solution to ${topic} must justify the method and verify that its assumptions still hold.`,
  }),
  ({ topic, grade }) => makeQuestion({
    subject: "Mathematics", grade, topic, family: "structural-reasoning",
    question: `A problem in ${topic} is changed so that one defining condition is removed while all visible surface features remain similar. You must identify the defining condition, predict which part of the original argument depends on it, and decide whether the original conclusion survives. What should an expert do first?`,
    answer: "Identify the condition that supports the original conclusion before attempting to reuse the method.",
    distractors: ["Reuse the original method because the problem still looks similar.", "Ignore the changed condition and compare only the final answers.", "Assume every theorem remains valid after one of its conditions is removed."],
    explanation: `Expert mathematics focuses on structure and conditions rather than surface similarity.`,
  }),
  ({ topic, grade }) => makeQuestion({
    subject: "Mathematics", grade, topic, family: "multiple-representations",
    question: `A difficult ${topic} problem can be represented in two different mathematical forms. Form A makes the relationship visible, while Form B makes computation or manipulation easier. An expert must translate between the forms, preserve the meaning, and use the form that exposes the decisive relationship. Which principle is being applied?`,
    answer: "Equivalent representations can reveal different structure, so the best representation depends on the reasoning task.",
    distractors: ["Different representations always describe different mathematical objects.", "The longest representation is automatically the most rigorous.", "Changing representation changes the underlying mathematical truth."],
    explanation: `Strong mathematical reasoning moves between equivalent representations to expose structure and reduce hidden assumptions.`,
  }),
  ({ topic, grade }) => makeQuestion({
    subject: "Mathematics", grade, topic, family: "strategy-selection",
    question: `You are given a non-routine ${topic} problem. Method A is shorter but works only under a special condition. Method B is longer but follows directly from definitions and remains valid under the stated conditions. After identifying the conditions and checking the target, which strategy is safest?`,
    answer: "Use Method B unless the special condition required by Method A has been proved for the problem.",
    distractors: ["Always use Method A because shorter methods are better.", "Use whichever method produces an answer first, without checking conditions.", "Choose randomly because equivalent methods never have different assumptions."],
    explanation: `Expert problem solving chooses methods by validity and assumptions, not by apparent speed alone.`,
  }),
];

const scienceTemplates = {
  "Integrated Science": [
    ({ topic, grade }) => makeQuestion({
      subject: "Integrated Science", grade, topic, family: "systems-cause-effect",
      question: `A community changes one practice related to ${topic}. At first, one observable change appears beneficial, but a second change emerges later. To reason correctly, you must identify the initial cause, trace the intermediate effect, and then evaluate the secondary consequence. Which approach gives the strongest scientific conclusion?`,
      answer: "Trace the causal chain and compare the evidence for both the immediate and secondary effects before judging the intervention.",
      distractors: ["Judge the intervention only from the first visible effect.", "Assume the later effect is unrelated because it appeared later.", "Choose the explanation that sounds most familiar without comparing evidence."],
      explanation: `Complex ${topic} problems require systems thinking: cause, intermediate mechanism, consequence, and evidence must be considered together.`,
    }),
    ({ topic, grade }) => makeQuestion({
      subject: "Integrated Science", grade, topic, family: "investigation-design",
      question: `A learner investigates a claim about ${topic} and obtains an unexpected result. Before repeating the investigation, the learner must identify the claim, determine which variable could explain the result, control competing explanations, and decide what observation would distinguish the possibilities. What is the best next step?`,
      answer: "Design a controlled follow-up investigation that isolates the most plausible competing explanation.",
      distractors: ["Discard the unexpected result because it conflicts with the prediction.", "Change several variables at once to see whether anything changes.", "Repeat the exact procedure without considering possible alternative explanations."],
      explanation: `Scientific investigation becomes stronger when unexpected evidence leads to a controlled test of competing explanations.`,
    }),
  ],
  Physics: [
    ({ topic, grade }) => makeQuestion({
      subject: "Physics", grade, topic, family: "model-evaluation",
      question: `A model is used to explain an observation involving ${topic}. The model correctly predicts the first observation but fails when one condition is changed. An expert must identify the model's assumption, determine why the changed condition matters, and decide whether the model should be modified or replaced. What is the strongest conclusion?`,
      answer: "The model is limited by an assumption that no longer holds, so the changed condition must be incorporated before the prediction can be trusted.",
      distractors: ["The model must always be correct because it worked once.", "The new observation should be ignored because it contradicts the model.", "Changing one condition can never affect a physical model."],
      explanation: `Physics models are useful within stated assumptions; expert reasoning tests those assumptions when conditions change.`,
    }),
    ({ topic, grade }) => makeQuestion({
      subject: "Physics", grade, topic, family: "mechanism-chain",
      question: `During an investigation of ${topic}, observation A changes, which affects quantity B, which then changes the final behaviour. To avoid a superficial answer, identify the physical law governing A→B, connect B to the final behaviour, and check whether an alternative mechanism could produce the same observation. Which conclusion is strongest?`,
      answer: "The explanation should name the governing relationship, connect the intermediate effect to the outcome, and rule out plausible alternatives with evidence.",
      distractors: ["Name only the final effect and assume the mechanism is obvious.", "Choose the first possible mechanism without checking alternatives.", "Use an unrelated physical quantity because it also changes during the experiment."],
      explanation: `Expert physics explanations require a causal mechanism rather than a description of the final observation alone.`,
    }),
  ],
  Chemistry: [
    ({ topic, grade }) => makeQuestion({
      subject: "Chemistry", grade, topic, family: "microscopic-macroscopic",
      question: `A chemical system involving ${topic} shows a visible change after one condition is altered. An expert must connect the macroscopic observation to particle-level behaviour, determine which interaction or process changed, and then predict what should happen if the condition is reversed. Which reasoning is strongest?`,
      answer: "Explain the particle-level change first, use it to account for the observation, and then use the same mechanism to predict the reverse condition.",
      distractors: ["Describe the colour or appearance without explaining the particles involved.", "Assume the reverse condition must produce the exact opposite result without analysing the mechanism.", "Explain the observation using a property that is unrelated to the reacting particles."],
      explanation: `Chemistry becomes deeper when macroscopic evidence is connected to particle-level structure and interactions.`,
    }),
    ({ topic, grade }) => makeQuestion({
      subject: "Chemistry", grade, topic, family: "competing-explanations",
      question: `Two explanations are proposed for an observation in ${topic}. Explanation A fits the initial observation but conflicts with a second piece of evidence. Explanation B explains both observations but requires a less familiar mechanism. What should an expert choose?`,
      answer: "Prefer Explanation B if it consistently accounts for all reliable evidence and its mechanism is chemically justified.",
      distractors: ["Prefer A because familiar explanations are automatically better.", "Prefer the explanation with the simpler wording regardless of evidence.", "Treat both explanations as equally strong even when one conflicts with evidence."],
      explanation: `Scientific explanations are judged by how well they account for the complete evidence, not by familiarity.`,
    }),
  ],
  Biology: [
    ({ topic, grade }) => makeQuestion({
      subject: "Biology", grade, topic, family: "homeostasis-and-feedback",
      question: `An organism experiences a disturbance involving ${topic}. The first response reduces the disturbance, but a second response is required to restore normal function. An expert must identify the stimulus, receptor or sensing process, response pathway, and final effect. Which description best represents the reasoning?`,
      answer: "The response should be explained as a linked regulatory pathway in which the detected change triggers mechanisms that reduce the disturbance.",
      distractors: ["The response is simply a single event with no regulatory feedback.", "The final effect can be explained without identifying what changed first.", "Any response that occurs after the disturbance must be positive feedback."],
      explanation: `Complex biological regulation is best understood as a sequence linking stimulus, detection, response and restoration.`,
    }),
    ({ topic, grade }) => makeQuestion({
      subject: "Biology", grade, topic, family: "evidence-and-inference",
      question: `A study of ${topic} finds that two groups show different outcomes. Before claiming that one factor caused the difference, an expert must compare the groups, identify possible confounding variables, and determine what additional evidence would separate correlation from causation. What is the strongest conclusion?`,
      answer: "The difference supports an association, but causation requires controlling plausible confounding factors or obtaining stronger experimental evidence.",
      distractors: ["Any association automatically proves causation.", "A difference between groups is meaningless because biology cannot be investigated experimentally.", "The most convenient explanation should be accepted without checking confounding factors."],
      explanation: `Expert biology distinguishes observation from causal inference and actively tests alternative explanations.`,
    }),
  ],
};

function genericExpertScience(subject, grade, topic) {
  return makeQuestion({
    subject, grade, topic, family: "transfer-and-evaluation",
    question: `A new situation is presented in ${topic}. You must first identify the governing principle, connect it to the evidence provided, consider what would change if one condition were altered, and then evaluate the competing explanations. Which response demonstrates expert scientific reasoning?`,
    answer: `Use the governing principle to explain the evidence, test the important assumptions, and justify the final conclusion against plausible alternatives.`,
    distractors: [
      "Select the explanation that matches the first observation without testing alternatives.",
      "Ignore assumptions and treat a single observation as conclusive proof.",
      "Describe the result without explaining the mechanism or evidence.",
    ],
    explanation: `Expert reasoning in ${topic} requires mechanism, evidence, assumptions and evaluation rather than recall alone.`,
  });
}

function generateExpertQuestion({ subject, grade, topic }) {
  if (subject === "Mathematics") return pick(mathTemplates)({ subject, grade, topic });
  const templates = scienceTemplates[subject];
  if (templates && templates.length) return pick(templates)({ subject, grade, topic });
  return genericExpertScience(subject, grade, topic);
}

module.exports = { generateExpertQuestion };
