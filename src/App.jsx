import { useMemo, useState } from "react";
import { FaCalculator, FaCheckCircle, FaLightbulb, FaRandom, FaBookOpen } from "react-icons/fa";
import "./App.css";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const normalize = v => String(v ?? "").trim().replace(/,/g, "").replace(/\s+/g, " ").toLowerCase();
const same = (a, b) => normalize(a) === normalize(b) || (Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && Math.abs(Number(a) - Number(b)) < 0.000001);

function makeQuestion(topic, difficulty) {
  const scale = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : difficulty === "Hard" ? 4 : 7;
  if (topic === "Arithmetic") { const a = rand(20, 80 * scale), b = rand(5, 40 * scale); return { q: `${a} + ${b} × 2 = ?`, answer: a + b * 2, hint: "Multiplication comes before addition.", explain: `${b} × 2 = ${b * 2}, then ${a} + ${b * 2} = ${a + b * 2}.` }; }
  if (topic === "Fractions") { const a = rand(1, 5), b = rand(a + 1, 9), c = rand(1, 5), n = a + c; return { q: `Simplify: ${a}/${b} + ${c}/${b}`, answer: `${n}/${b}`, hint: "The denominators are already equal.", explain: `Add the numerators: ${a} + ${c} = ${n}. So the result is ${n}/${b}.` }; }
  if (topic === "Percentages") { const p = rand(2, 9) * 5, n = rand(20, 200) * scale, ans = n * p / 100; return { q: `Find ${p}% of ${n}.`, answer: ans, hint: "Convert the percentage to a decimal and multiply.", explain: `${p}% = ${p}/100. Then ${n} × ${p}/100 = ${ans}.` }; }
  if (topic === "Linear Equations") { const x = rand(3, 15 * scale), a = rand(2, 9), b = rand(1, 20), c = a * x + b; return { q: `Solve for x: ${a}x + ${b} = ${c}`, answer: x, hint: `Subtract ${b} from both sides first.`, explain: `${a}x = ${c - b}; divide by ${a}; x = ${x}.` }; }
  if (topic === "Quadratics") { const x1 = rand(2, 9), x2 = rand(1, 7); return { q: `Solve: (x − ${x1})(x + ${x2}) = 0. Give the two values of x.`, answer: `${x1}, -${x2}`, hint: "Set each factor equal to zero.", explain: `x − ${x1} = 0 gives x = ${x1}; x + ${x2} = 0 gives x = −${x2}.` }; }
  if (topic === "Geometry") { const w = rand(4, 15 * scale), h = rand(3, 12 * scale); return { q: `A rectangle has length ${w} cm and width ${h} cm. Find its area in cm².`, answer: w * h, hint: "Area = length × width.", explain: `${w} × ${h} = ${w * h} cm².` }; }
  const n = rand(2, 12 * scale); return { q: `If f(x) = 3x² − 2, find f(${n}).`, answer: 3 * n * n - 2, hint: `Replace x with ${n}.`, explain: `3(${n})² − 2 = ${3 * n * n} − 2 = ${3 * n * n - 2}.` };
}

const topics = ["Arithmetic", "Fractions", "Percentages", "Linear Equations", "Quadratics", "Geometry", "Functions"];
const difficulties = ["Easy", "Medium", "Hard", "Expert"];

export default function App() {
  const [topic, setTopic] = useState("Linear Equations");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questions, setQuestions] = useState(() => Array.from({ length: 5 }, () => makeQuestion("Linear Equations", "Medium")));
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [hint, setHint] = useState({});
  const score = useMemo(() => questions.reduce((n, q, i) => n + (same(answers[i], q.answer) ? 1 : 0), 0), [answers, questions]);
  const generate = () => { setQuestions(Array.from({ length: 5 }, () => makeQuestion(topic, difficulty))); setAnswers({}); setHint({}); setSubmitted(false); };

  return <div className="app">
    <header><div className="brand"><span className="logo"><FaCalculator /></span><div><b>MathLab</b><small>Learn • Solve • Master</small></div></div><span className="pill"><FaBookOpen /> Interactive Math</span></header>
    <main>
      <section className="hero"><span>YOUR MATH WORKSPACE</span><h1>Understand the math.<br/><em>Don't just get the answer.</em></h1><p>Practise problems, request hints, submit your work, and see the reasoning behind every answer.</p></section>
      <section className="setup card"><div className="setup-title"><div><h2>Practice setup</h2><p>Choose a topic and difficulty, then generate a fresh set.</p></div><FaLightbulb /></div>
        <div className="controls"><label>Topic<select value={topic} onChange={e => setTopic(e.target.value)}>{topics.map(t => <option key={t}>{t}</option>)}</select></label><label>Difficulty<div className="difficulty">{difficulties.map(d => <button type="button" className={difficulty === d ? "active" : ""} onClick={() => setDifficulty(d)} key={d}>{d}</button>)}</div></label></div>
        <button className="primary" onClick={generate}><FaRandom /> Generate 5 Problems</button>
      </section>
      {submitted && <section className="score"><div><small>SESSION SCORE</small><strong>{score} / {questions.length}</strong><p>{score === questions.length ? "Perfect. 🔥" : score >= 3 ? "Good work. Review the ones you missed." : "Keep practising. Use hints and study the explanations."}</p></div><FaCheckCircle /></section>}
      <section className="workspace"><div className="workspace-head"><div><span>PRACTICE SESSION</span><h2>{topic} · {difficulty}</h2></div><button className="outline" onClick={generate}><FaRandom /> New set</button></div>
        {questions.map((q, i) => <article className="question card" key={i}><div className="qnum">PROBLEM {i + 1}</div><h3>{q.q}</h3><div className="answer-row"><input disabled={submitted} value={answers[i] ?? ""} onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} placeholder="Enter your answer"/><button className="hint" onClick={() => setHint(h => ({ ...h, [i]: !h[i] }))}><FaLightbulb /> {hint[i] ? "Hide hint" : "Hint"}</button></div>{hint[i] && !submitted && <div className="hintbox">💡 {q.hint}</div>}{submitted && <div className={same(answers[i], q.answer) ? "result good" : "result bad"}><b>{same(answers[i], q.answer) ? "Correct ✓" : `Not quite. Answer: ${q.answer}`}</b><p>{q.explain}</p></div>}</article>)}
        {!submitted && <button className="primary submit" onClick={() => setSubmitted(true)}><FaCheckCircle /> Check my work</button>}
      </section>
    </main>
  </div>;
}
