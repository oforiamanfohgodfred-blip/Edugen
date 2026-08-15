const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateAIQuestions = async ({
  subject,
  topic,
  level,
  difficulty,
  questionType,
  count,
}) => {
  const prompt = `
You are EduGen, an educational question-generation engine.

Generate ${count} high-quality ${subject} questions.

EDUCATIONAL SETTINGS:
- Subject: ${subject}
- Topic: ${topic}
- Student level: ${level}
- Difficulty: ${difficulty}
- Question type: ${questionType}

IMPORTANT REQUIREMENTS:

1. Questions must be appropriate for the specified student level.
2. Questions must genuinely match the requested difficulty.
3. Do NOT make hard questions difficult merely by using larger numbers.
4. Hard questions should require deeper reasoning, multiple steps,
   application, interpretation, or problem solving where appropriate.
5. Avoid repetitive questions.
6. Vary the wording and structure of every question.
7. Do not use trivia unrelated to the selected topic.
8. For Mathematics, carefully calculate and verify every answer.
9. For Science, make sure scientific facts are accurate.
10. Every multiple-choice question must have exactly four options.
11. Only one option may be correct.
12. Explanations should teach the student why the answer is correct.
13. Use clear, age-appropriate educational language.
14. Do not include dangerous experiments or unsafe instructions.
15. Do not include answers outside the JSON structure.
16. Return ONLY valid JSON.

Return this exact structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": "The exact correct option",
      "explanation": "A clear educational explanation.",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "learningObjective": "What the student should learn"
    }
  ]
}
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = response.output_text;

  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.error("AI returned invalid JSON:", text);
    throw new Error("AI returned invalid question data.");
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("AI response does not contain a questions array.");
  }

  return parsed.questions;
};

module.exports = {
  generateAIQuestions,
};