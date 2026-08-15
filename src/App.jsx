import { useMemo, useState } from "react";
import {
  FaBookOpen,
  FaCalculator,
  FaFlask,
  FaAtom,
  FaDna,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaRandom,
  FaGraduationCap,
  FaLightbulb,
  FaKeyboard,
} from "react-icons/fa";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/api/questions/generate";

const subjects = {
  Mathematics: {
    icon: <FaCalculator />,
    topics: [
      "Algebra",
      "Linear Equations",
      "Simultaneous Equations",
      "Quadratic Equations",
      "Indices",
      "Logarithms",
      "Functions",
      "Sequences and Series",
      "Percentages",
      "Ratio",
      "Geometry",
      "Mensuration",
      "Probability",
      "Statistics",
      "Trigonometry",
      "Vectors",
      "Coordinate Geometry",
      "Calculus",
    ],
  },

  Biology: {
    icon: <FaDna />,
    topics: [
      "Cell Biology",
      "Human Biology",
      "Genetics",
      "Photosynthesis",
      "Respiration",
      "Ecology",
      "Evolution",
      "Reproduction",
      "Homeostasis",
      "Nutrition",
      "Disease and Immunity",
    ],
  },

  Physics: {
    icon: <FaAtom />,
    topics: [
      "Motion",
      "Forces",
      "Energy",
      "Work and Power",
      "Momentum",
      "Electricity",
      "Waves",
      "Heat",
      "Pressure",
      "Circular Motion",
      "Gravitation",
      "Optics",
    ],
  },

  Chemistry: {
    icon: <FaFlask />,
    topics: [
      "Atomic Structure",
      "Periodic Table",
      "Chemical Bonding",
      "Moles",
      "Stoichiometry",
      "Acids and Bases",
      "Chemical Reactions",
      "Organic Chemistry",
      "Electrochemistry",
      "Rates of Reaction",
      "Chemical Equilibrium",
    ],
  },
};

const difficultyInfo = {
  Easy: "Build your foundation",
  Medium: "Apply what you know",
  Hard: "Challenge your reasoning",
  Expert: "Extreme SHS-level challenge",
};

const questionTypes = [
  "Multiple Choice",
  "Problem Solving",
  "Word Problems",
  "True / False",
];

function App() {
  const [subject, setSubject] = useState("Mathematics");

  const [topic, setTopic] = useState(
    "Algebra"
  );

  const [level, setLevel] = useState("SHS");

  const [difficulty, setDifficulty] =
    useState("Hard");

  const [questionType, setQuestionType] =
    useState("Multiple Choice");

  const [count, setCount] = useState(5);

  const [questions, setQuestions] = useState(
    []
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [revealed, setRevealed] =
    useState({});

  const [selectedAnswers, setSelectedAnswers] =
    useState({});

  const [typedAnswers, setTypedAnswers] =
    useState({});

  const [submitted, setSubmitted] =
    useState(false);

  const currentSubject = subjects[subject];

  const isWrittenQuestion =
    questionType === "Problem Solving" ||
    questionType === "Word Problems";

  const score = useMemo(() => {
    if (!submitted) return 0;

    return questions.reduce(
      (total, question, index) => {
        const expected = String(
          question.answer ?? ""
        )
          .trim()
          .toLowerCase();

        const selected = String(
          selectedAnswers[index] ??
            typedAnswers[index] ??
            ""
        )
          .trim()
          .toLowerCase();

        if (!selected) return total;

        /*
          For written answers we first try
          exact matching. This is intentionally
          simple for now because mathematical
          answer evaluation will be upgraded
          on the backend.
        */
        if (selected === expected) {
          return total + 1;
        }

        return total;
      },
      0
    );
  }, [
    submitted,
    questions,
    selectedAnswers,
    typedAnswers,
  ]);

  const handleSubjectChange = (
    newSubject
  ) => {
    setSubject(newSubject);

    setTopic(
      subjects[newSubject].topics[0]
    );

    setQuestions([]);
    setRevealed({});
    setSelectedAnswers({});
    setTypedAnswers({});
    setSubmitted(false);
    setError("");
  };

  const generateQuestions = async () => {
    setLoading(true);
    setError("");

    setQuestions([]);
    setRevealed({});
    setSelectedAnswers({});
    setTypedAnswers({});
    setSubmitted(false);

    try {
      const response = await fetch(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            subject,
            topic,
            level,
            difficulty,
            questionType,
            count: Number(count),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to generate questions."
        );
      }

      /*
        Safety check:
        The UI should display exactly
        what the backend returned.
      */
      setQuestions(
        Array.isArray(data.questions)
          ? data.questions.slice(
              0,
              Number(count)
            )
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't generate the questions. Make sure the EduGen backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (
    questionIndex,
    answer
  ) => {
    if (submitted) return;

    setSelectedAnswers(
      (previous) => ({
        ...previous,
        [questionIndex]: answer,
      })
    );
  };

  const updateTypedAnswer = (
    questionIndex,
    value
  ) => {
    if (submitted) return;

    setTypedAnswers(
      (previous) => ({
        ...previous,
        [questionIndex]: value,
      })
    );
  };

  const toggleAnswer = (index) => {
    setRevealed(
      (previous) => ({
        ...previous,
        [index]: !previous[index],
      })
    );
  };

  const submitQuiz = () => {
    setSubmitted(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const answeredCount = questions.reduce(
    (total, _, index) => {
      const answer =
        selectedAnswers[index] ??
        typedAnswers[index];

      return answer ? total + 1 : total;
    },
    0
  );

  return (
    <div className="app">
      {/* ================= HEADER ================= */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <FaBookOpen />
          </div>

          <div>
            <h1>EduGen</h1>

            <span>
              Learn. Practice. Improve.
            </span>
          </div>
        </div>

        <div className="topbar-badge">
          <FaGraduationCap />

          Smart Question Generator
        </div>
      </header>

      <main className="container">
        {/* ================= HERO ================= */}

        <section className="hero">
          <div>
            <span className="eyebrow">
              PERSONALIZED LEARNING
            </span>

            <h2>
              Generate questions that
              <span> challenge you.</span>
            </h2>

            <p>
              Build personalized
              Mathematics and Science
              practice sessions using
              your level, topic and
              difficulty.
            </p>
          </div>
        </section>

        {/* ================= GENERATOR ================= */}

        <section className="generator-card">
          <div className="section-heading">
            <div>
              <h3>
                Question Setup
              </h3>

              <p>
                Customize your practice
                session.
              </p>
            </div>

            <FaLightbulb />
          </div>

          <div className="form-grid">
            {/* SUBJECT */}

            <div className="field full">
              <label>
                Subject
              </label>

              <div className="subject-grid">
                {Object.entries(
                  subjects
                ).map(
                  ([name, data]) => (
                    <button
                      key={name}
                      type="button"
                      className={`subject-option ${
                        subject === name
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleSubjectChange(
                          name
                        )
                      }
                    >
                      <span>
                        {data.icon}
                      </span>

                      {name}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* TOPIC */}

            <div className="field">
              <label>
                Topic
              </label>

              <select
                value={topic}
                onChange={(e) =>
                  setTopic(
                    e.target.value
                  )
                }
              >
                {currentSubject.topics.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* LEVEL */}

            <div className="field">
              <label>
                Level
              </label>

              <select
                value={level}
                onChange={(e) =>
                  setLevel(
                    e.target.value
                  )
                }
              >
                <option>
                  JHS
                </option>

                <option>
                  SHS
                </option>

                <option>
                  University
                </option>
              </select>
            </div>

            {/* QUESTION TYPE */}

            <div className="field">
              <label>
                Question Type
              </label>

              <select
                value={questionType}
                onChange={(e) =>
                  setQuestionType(
                    e.target.value
                  )
                }
              >
                {questionTypes.map(
                  (type) => (
                    <option
                      key={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>

              {isWrittenQuestion && (
                <small className="field-hint">
                  <FaKeyboard />
                  You will type your
                  answer instead of
                  selecting an option.
                </small>
              )}
            </div>

            {/* QUESTION COUNT */}

            <div className="field">
              <label>
                Number of Questions
              </label>

              <select
                value={count}
                onChange={(e) =>
                  setCount(
                    Number(
                      e.target.value
                    )
                  )
                }
              >
                <option value={5}>
                  5 Questions
                </option>

                <option value={10}>
                  10 Questions
                </option>

                <option value={15}>
                  15 Questions
                </option>

                <option value={20}>
                  20 Questions
                </option>
              </select>
            </div>

            {/* DIFFICULTY */}

            <div className="field full">
              <label>
                Difficulty

                <span className="difficulty-value">
                  {difficulty}
                </span>
              </label>

              <div className="difficulty-grid">
                {Object.entries(
                  difficultyInfo
                ).map(
                  ([
                    name,
                    description,
                  ]) => (
                    <button
                      key={name}
                      type="button"
                      className={`difficulty ${
                        difficulty ===
                        name
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setDifficulty(
                          name
                        )
                      }
                    >
                      <strong>
                        {name}
                      </strong>

                      <small>
                        {description}
                      </small>
                    </button>
                  )
                )}
              </div>

              {difficulty ===
                "Expert" && (
                <div className="expert-warning">
                  🔥 <strong>
                    Expert Mode
                  </strong>

                  <span>
                    Expect very large
                    numbers, multi-step
                    calculations, tricky
                    reasoning and
                    exam-level problems.
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="generate-button"
            onClick={
              generateQuestions
            }
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />

                Generating...
              </>
            ) : (
              <>
                <FaRandom />

                Generate Questions
              </>
            )}
          </button>
        </section>

        {/* ================= SCORE ================= */}

        {submitted &&
          questions.length > 0 && (
            <section className="score-card">
              <div>
                <span>
                  YOUR SCORE
                </span>

                <strong>
                  {score} /{" "}
                  {questions.length}
                </strong>

                <small>
                  {score ===
                  questions.length
                    ? "Perfect score! 🔥"
                    : score >=
                      questions.length *
                        0.7
                    ? "Great work! Keep pushing."
                    : "Keep practicing. You can improve!"}
                </small>
              </div>

              <FaCheckCircle />
            </section>
          )}

        {/* ================= QUESTIONS ================= */}

        {questions.length > 0 && (
          <section className="questions-section">
            <div className="questions-heading">
              <div>
                <span className="eyebrow">
                  PRACTICE SESSION
                </span>

                <h3>
                  {subject} ·{" "}
                  {topic}
                </h3>

                <small>
                  {questions.length}{" "}
                  questions ·{" "}
                  {difficulty} ·{" "}
                  {questionType}
                </small>
              </div>

              <button
                className="secondary-button"
                onClick={
                  generateQuestions
                }
                disabled={loading}
              >
                <FaRandom />

                New Set
              </button>
            </div>

            {/* ANSWER PROGRESS */}

            {!submitted && (
              <div className="answer-progress">
                <span>
                  Answered{" "}
                  {answeredCount} of{" "}
                  {questions.length}
                </span>

                <div>
                  <span
                    style={{
                      width: `${
                        questions.length
                          ? (answeredCount /
                              questions.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {questions.map(
              (
                question,
                index
              ) => {
                const selected =
                  selectedAnswers[
                    index
                  ];

                const typed =
                  typedAnswers[
                    index
                  ];

                const userAnswer =
                  selected ??
                  typed ??
                  "";

                const correct =
                  String(
                    userAnswer
                  )
                    .trim()
                    .toLowerCase() ===
                  String(
                    question.answer
                  )
                    .trim()
                    .toLowerCase();

                return (
                  <article
                    className="question-card"
                    key={
                      question.id ||
                      index
                    }
                  >
                    <div className="question-top">
                      <span>
                        Question{" "}
                        {index + 1}
                      </span>

                      <div>
                        <span
                          className={`tag ${difficulty.toLowerCase()}`}
                        >
                          {difficulty}
                        </span>

                        {question.questionType && (
                          <span className="tag">
                            {
                              question.questionType
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <h4>
                      {
                        question.question
                      }
                    </h4>

                    {/* ================= MC / TRUE FALSE ================= */}

                    {!isWrittenQuestion &&
                      question.options &&
                      question.options
                        .length >
                        0 && (
                        <div className="options">
                          {question.options.map(
                            (
                              option,
                              optionIndex
                            ) => {
                              const isSelected =
                                selected ===
                                option;

                              const isCorrect =
                                submitted &&
                                option ===
                                  question.answer;

                              const isWrong =
                                submitted &&
                                isSelected &&
                                !correct;

                              return (
                                <button
                                  type="button"
                                  key={`${option}-${optionIndex}`}
                                  className={`option ${
                                    isSelected
                                      ? "selected"
                                      : ""
                                  } ${
                                    isCorrect
                                      ? "correct"
                                      : ""
                                  } ${
                                    isWrong
                                      ? "wrong"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    selectAnswer(
                                      index,
                                      option
                                    )
                                  }
                                >
                                  <span className="option-letter">
                                    {question.questionType ===
                                    "True / False"
                                      ? option
                                      : String.fromCharCode(
                                          65 +
                                            optionIndex
                                        )}
                                  </span>

                                  <span>
                                    {option}
                                  </span>

                                  {isCorrect && (
                                    <FaCheckCircle />
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}

                    {/* ================= WRITTEN ANSWER ================= */}

                    {isWrittenQuestion && (
                      <div className="written-answer">
                        <label>
                          Your Answer
                        </label>

                        <textarea
                          value={
                            typedAnswers[
                              index
                            ] || ""
                          }
                          onChange={(e) =>
                            updateTypedAnswer(
                              index,
                              e.target.value
                            )
                          }
                          disabled={
                            submitted
                          }
                          placeholder={
                            "Show your working and enter your final answer..."
                          }
                          rows={4}
                        />

                        {submitted && (
                          <div
                            className={
                              correct
                                ? "written-result correct-result"
                                : "written-result wrong-result"
                            }
                          >
                            {correct
                              ? "✓ Correct!"
                              : "✕ Not quite."}

                            {!correct && (
                              <>
                                {" "}
                                Correct
                                answer:{" "}
                                <strong>
                                  {
                                    question.answer
                                  }
                                </strong>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ================= INCORRECT ================= */}

                    {submitted &&
                      !isWrittenQuestion &&
                      selected &&
                      !correct && (
                        <div className="incorrect">
                          ✕ Not quite.

                          <span>
                            The correct
                            answer is{" "}
                            <strong>
                              {
                                question.answer
                              }
                            </strong>
                          </span>
                        </div>
                      )}

                    {/* ================= FOOTER ================= */}

                    <div className="question-footer">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAnswer(
                            index
                          )
                        }
                      >
                        {revealed[
                          index
                        ] ? (
                          <>
                            <FaEyeSlash />
                            Hide Explanation
                          </>
                        ) : (
                          <>
                            <FaEye />
                            Show Explanation
                          </>
                        )}
                      </button>

                      {question.learningObjective && (
                        <span>
                          🎯{" "}
                          {
                            question.learningObjective
                          }
                        </span>
                      )}
                    </div>

                    {/* ================= EXPLANATION ================= */}

                    {revealed[
                      index
                    ] && (
                      <div className="explanation">
                        <strong>
                          Answer:{" "}
                          {
                            question.answer
                          }
                        </strong>

                        <p>
                          {
                            question.explanation
                          }
                        </p>
                      </div>
                    )}
                  </article>
                );
              }
            )}

            {/* ================= SUBMIT ================= */}

            {!submitted && (
              <button
                className="submit-button"
                onClick={submitQuiz}
              >
                <FaCheckCircle />

                Submit Quiz
              </button>
            )}
          </section>
        )}
      </main>

      <footer>
        <FaBookOpen />

        <span>
          EduGen — Practice smarter,
          learn better.
        </span>
      </footer>
    </div>
  );
}

export default App;