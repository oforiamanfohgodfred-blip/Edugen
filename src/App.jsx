import { useMemo, useState } from "react";
import { FaBookOpen, FaCalculator, FaFlask, FaAtom, FaDna, FaCheckCircle, FaRandom, FaGraduationCap, FaLightbulb, FaKeyboard } from "react-icons/fa";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/api/questions/generate";

const CURRICULUM = {
  JHS1: {
    Mathematics: ["Whole Numbers and Place Value","Fractions","Decimals","Percentages","Ratio","Basic Algebraic Expressions","Simple Linear Equations","Lines and Angles","Plane Shapes","Measurement","Data Collection and Representation","Basic Probability"],
    "Integrated Science": ["Materials and Their Properties","Living and Non-Living Things","Cells and Simple Organisation","Human Health and Nutrition","Plants and Their Functions","Matter and Changes of State","Energy Forms and Sources","Forces and Simple Machines","The Solar System","Water and Air","Environment and Sanitation"]
  },
  JHS2: {
    Mathematics: ["Integers and Rational Numbers","Fractions and Percentages","Ratio and Proportion","Indices","Algebraic Expressions","Linear Equations","Sequences and Patterns","Angles and Polygons","Transformations","Perimeter Area and Volume","Statistics","Probability"],
    "Integrated Science": ["Particle Nature of Matter","Mixtures and Separation","Chemical Changes","Cell Structure and Functions","Reproduction in Plants and Animals","Human Body Systems","Food and Digestion","Heat and Temperature","Light and Sound","Electricity","Forces and Motion","Ecology and Food Chains"]
  },
  JHS3: {
    Mathematics: ["Number Bases and Numeration","Standard Form and Approximation","Indices and Surds","Percentages and Financial Mathematics","Direct and Inverse Proportion","Linear and Simultaneous Equations","Sequences and Relations","Pythagoras and Right Triangles","Bearings and Scale Drawing","Circles and Solid Shapes","Statistics and Data Interpretation","Probability"],
    "Integrated Science": ["Atomic Structure and Elements","Chemical Reactions","Acids Bases and Salts","Cells and Organisation","Inheritance and Variation","Human Reproductive Health","Respiration and Excretion","Force Work and Energy","Electricity and Electromagnetism","Waves and Sound","Earth Resources and Climate","Ecosystems and Conservation"]
  },
  SHS1: {
    Mathematics: ["Real Numbers","Surds and Indices","Logarithms","Sets","Functions and Relations","Algebraic Expressions and Equations","Sequences and Series","Coordinate Geometry","Mensuration","Vectors","Descriptive Statistics","Probability"],
    Physics: ["Physical Quantities and Measurement","Vectors and Scalars","Kinematics","Dynamics","Work Energy and Power","Circular Motion","Properties of Matter","Heat and Temperature"],
    Chemistry: ["Matter and Measurement","Atomic Structure","Periodic Table","Chemical Bonding","Mole Concept and Stoichiometry","Chemical Equations","States of Matter","Energetics"],
    Biology: ["Biology as a Science","Cell Structure and Function","Biological Molecules","Enzymes","Nutrition","Transport in Plants","Transport in Animals","Ecology","Classification"]
  },
  SHS2: {
    Mathematics: ["Algebraic Fractions","Quadratic Equations","Inequalities","Binomial Expansion","Arithmetic and Geometric Progressions","Trigonometry","Matrices","Vectors","Coordinate Geometry","Statistics","Probability Distributions"],
    Physics: ["Momentum and Collisions","Gravitation","Simple Harmonic Motion","Waves","Sound","Optics","Electric Fields","Current Electricity","DC Circuits"],
    Chemistry: ["Solutions","Acids Bases and pH","Redox Reactions","Electrochemistry","Chemical Kinetics","Chemical Equilibrium","Organic Chemistry","Hydrocarbons"],
    Biology: ["Cell Division","Genetics and Inheritance","Evolution","Homeostasis","Excretion","Coordination and Response","Reproduction","Plant Growth","Ecology and Population"]
  },
  SHS3: {
    Mathematics: ["Advanced Functions","Differentiation","Applications of Differentiation","Integration","Applications of Integration","Advanced Trigonometry","Complex Numbers","Permutations and Combinations","Advanced Probability","Statistical Inference"],
    Physics: ["Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Modern Physics","Atomic Physics","Nuclear Physics","Semiconductors","Electronics","Energy and Society"],
    Chemistry: ["Advanced Organic Chemistry","Alcohols and Carboxylic Acids","Polymers","Aromatic Compounds","Chemical Equilibrium","Solubility Equilibria","Thermodynamics","Industrial Chemistry"],
    Biology: ["Advanced Genetics","Gene Expression","Biotechnology","Immunity and Disease","Mammalian Physiology","Plant Physiology","Population Ecology","Conservation Biology","Applied Biology"]
  }
};

const subjectIcon = { Mathematics: <FaCalculator />, "Integrated Science": <FaFlask />, Physics: <FaAtom />, Chemistry: <FaFlask />, Biology: <FaDna /> };
const difficultyInfo = { Easy: "Build your foundation", Medium: "Apply what you know", Hard: "Challenge your reasoning", Expert: "Deep multi-step exam challenge" };
const questionTypes = ["Multiple Choice", "Short Answer", "Problem Solving", "Word Problem", "Mixed"];
const grades = Object.keys(CURRICULUM);

function App() {
  const [grade, setGrade] = useState("SHS1");
  const subjects = CURRICULUM[grade];
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState(CURRICULUM.SHS1.Mathematics[0]);
  const [difficulty, setDifficulty] = useState("Hard");
  const [questionType, setQuestionType] = useState("Multiple Choice");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((total, q, i) => String(answers[i] ?? "").trim().toLowerCase() === String(q.answer ?? q.correctAnswer ?? "").trim().toLowerCase() ? total + 1 : total, 0);
  }, [submitted, questions, answers]);

  const resetQuiz = () => { setQuestions([]); setAnswers({}); setSubmitted(false); setError(""); };

  const changeGrade = (value) => {
    const nextSubjects = CURRICULUM[value];
    const nextSubject = Object.keys(nextSubjects)[0];
    setGrade(value); setSubject(nextSubject); setTopic(nextSubjects[nextSubject][0]); resetQuiz();
  };

  const changeSubject = (value) => { setSubject(value); setTopic(CURRICULUM[grade][value][0]); resetQuiz(); };

  const generateQuestions = async () => {
    setLoading(true); setError(""); resetQuiz();
    try {
      const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, topic, grade, level: grade, difficulty, questionType, count: Number(count) }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to generate questions.");
      if (!Array.isArray(data.questions) || data.questions.length !== Number(count)) throw new Error(`The engine returned ${data.questions?.length || 0} of ${count} requested questions.`);
      setQuestions(data.questions);
    } catch (err) { console.error(err); setError(err.message || "Could not generate questions. Make sure the backend is running."); }
    finally { setLoading(false); }
  };

  const selectAnswer = (index, value) => { if (!submitted) setAnswers(prev => ({ ...prev, [index]: value })); };
  const answered = Object.keys(answers).length;

  return (
    <div className="app">
      <header className="topbar"><div className="brand"><div className="brand-icon"><FaBookOpen /></div><div><h1>EduGen</h1><span>Learn. Practice. Improve.</span></div></div><div className="topbar-badge"><FaGraduationCap /> Smart Question Generator</div></header>
      <main className="container">
        <section className="hero"><div><span className="eyebrow">PERSONALIZED LEARNING</span><h2>Generate questions that <span>challenge you.</span></h2><p>Build a complete practice session from the Ghana curriculum with dynamic questions, quality checks and optional textbook grounding.</p></div></section>

        <section className="generator-card">
          <div className="section-heading"><div><h3>Question Setup</h3><p>Choose exactly what you want to practise.</p></div><FaLightbulb /></div>
          <div className="form-grid">
            <div className="field"><label>Grade</label><select value={grade} onChange={e => changeGrade(e.target.value)}>{grades.map(g => <option key={g}>{g}</option>)}</select></div>
            <div className="field"><label>Subject</label><select value={subject} onChange={e => changeSubject(e.target.value)}>{Object.keys(subjects).map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="field full"><label>Topic</label><select value={topic} onChange={e => setTopic(e.target.value)}>{subjects[subject].map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label>Question Type</label><select value={questionType} onChange={e => setQuestionType(e.target.value)}>{questionTypes.map(t => <option key={t}>{t}</option>)}</select>{(questionType === "Short Answer" || questionType === "Problem Solving" || questionType === "Word Problem") && <small className="field-hint"><FaKeyboard /> Type your answer.</small>}</div>
            <div className="field"><label>Number of Questions</label><select value={count} onChange={e => setCount(Number(e.target.value))}>{[5,10,15,20,25,30,40,50].map(n => <option key={n} value={n}>{n} Questions</option>)}</select></div>
            <div className="field full"><label>Difficulty <span className="difficulty-value">{difficulty}</span></label><div className="difficulty-grid">{Object.entries(difficultyInfo).map(([name, description]) => <button key={name} type="button" className={`difficulty ${difficulty === name ? "active" : ""}`} onClick={() => setDifficulty(name)}><strong>{name}</strong><small>{description}</small></button>)}</div></div>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="generate-button" onClick={generateQuestions} disabled={loading}>{loading ? <><span className="spinner" /> Generating...</> : <><FaRandom /> Generate {count} Questions</>}</button>
        </section>

        {submitted && questions.length > 0 && <section className="score-card"><div><span>YOUR SCORE</span><strong>{score} / {questions.length}</strong><small>{score === questions.length ? "Perfect score! 🔥" : score >= questions.length * .7 ? "Great work! Keep pushing." : "Keep practising — review your mistakes below."}</small></div><FaCheckCircle /></section>}

        {questions.length > 0 && <section className="questions-section">
          <div className="questions-heading"><div><span className="eyebrow">PRACTICE SESSION</span><h3>{subject} · {topic}</h3><small>{grade} · {questions.length} questions · {difficulty} · {questionType}</small></div><button className="secondary-button" onClick={generateQuestions} disabled={loading}><FaRandom /> New Set</button></div>
          {!submitted && <div className="answer-progress"><span>Answered {answered} of {questions.length}</span><div><span style={{ width: `${(answered / questions.length) * 100}%` }} /></div></div>}
          {questions.map((q, index) => {
            const options = Array.isArray(q.options) ? q.options : [];
            const written = !options.length || questionType === "Short Answer" || questionType === "Problem Solving" || questionType === "Word Problem";
            const correct = String(q.answer ?? q.correctAnswer ?? "").trim().toLowerCase();
            const chosen = String(answers[index] ?? "").trim().toLowerCase();
            return <article className="question-card" key={q.id || index}>
              <div className="question-number">Question {index + 1}</div>
              <h4>{q.question}</h4>
              {options.length > 0 && !written && <div className="options">{options.map((option, oi) => <button key={oi} type="button" disabled={submitted} className={`option ${chosen === String(option).trim().toLowerCase() ? "selected" : ""} ${submitted && String(option).trim().toLowerCase() === correct ? "correct" : submitted && chosen === String(option).trim().toLowerCase() ? "wrong" : ""}`} onClick={() => selectAnswer(index, option)}>{String.fromCharCode(65 + oi)}. {option}</button>)}</div>}
              {written && <input className="answer-input" disabled={submitted} value={answers[index] || ""} onChange={e => selectAnswer(index, e.target.value)} placeholder="Type your answer..." />}
              {submitted && <div className={`answer-result ${chosen === correct ? "correct" : "wrong"}`}><strong>{chosen === correct ? "Correct ✓" : `Incorrect — correct answer: ${q.answer ?? q.correctAnswer ?? "See explanation"}`}</strong><p>{q.explanation || "Review the concept and work through the question again."}</p></div>}
            </article>;
          })}
          {!submitted && <button className="generate-button" onClick={() => setSubmitted(true)}><FaCheckCircle /> Submit Quiz</button>}
        </section>}
      </main>
    </div>
  );
}

export default App;
