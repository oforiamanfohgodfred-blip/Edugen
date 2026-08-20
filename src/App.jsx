import { useState } from "react";
import { FaBookOpen, FaCalculator, FaCheckCircle, FaLightbulb, FaRedo, FaGraduationCap } from "react-icons/fa";
import { solveMath } from "./mathEngine";
import "./App.css";

const examples = {
  "Calculator": "128583 - 48858",
  "Equation Solver": "3x + 7 = 25",
  "Practice": "48 / (3 + 5) + 2^3"
};

const lessons = {
  "Order of Operations": {
    title: "Order of Operations",
    text: "When an expression contains several operations, use a consistent order: brackets, powers, multiplication/division, then addition/subtraction.",
    example: "48 / (3 + 5) + 2^3 = 14"
  },
  "Linear Equations": {
    title: "Linear Equations",
    text: "The goal is to isolate x. Whatever operation you perform on one side must also be performed on the other side.",
    example: "3x + 7 = 25  →  3x = 18  →  x = 6"
  },
  "Fractions": {
    title: "Fractions",
    text: "For addition and subtraction, use a common denominator. For multiplication, multiply numerators and denominators. For division, multiply by the reciprocal.",
    example: "2/3 × 3/4 = 6/12 = 1/2"
  }
};

function App() {
  const [mode, setMode] = useState("Calculator");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [lesson, setLesson] = useState("Order of Operations");
  const [practice, setPractice] = useState({ a: 24, b: 8, op: "+", answer: 32 });

  const solve = () => {
    try {
      setResult(solveMath(input, mode));
      setShowSteps(false);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  const loadExample = () => setInput(examples[mode] || examples.Calculator);
  const reset = () => { setInput(""); setResult(null); setShowSteps(false); };

  const newPractice = () => {
    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * 9) + 2;
    const operations = ["+", "−", "×"];
    const op = operations[Math.floor(Math.random() * operations.length)];
    const answer = op === "+" ? a + b : op === "−" ? a - b : a * b;
    setPractice({ a, b, op, answer });
  };

  return (
    <div className="math-app">
      <header className="topbar">
        <div className="brand"><div className="brand-icon"><FaCalculator /></div><div><h1>MathLab</h1><span>Learn · Solve · Understand</span></div></div>
        <div className="student-badge"><FaGraduationCap /> Personal Math Workspace</div>
      </header>

      <main className="workspace">
        <section className="welcome">
          <div><span className="eyebrow">INTERACTIVE MATH LEARNING</span><h2>Your space to <span>solve mathematics.</span></h2><p>Work through problems, reveal the reasoning, practise your weak areas and learn the method — not just the final answer.</p></div>
          <div className="welcome-icon"><FaBookOpen /></div>
        </section>

        <div className="mode-tabs">
          {Object.keys(examples).map(item => <button key={item} className={mode === item ? "active" : ""} onClick={() => { setMode(item); setResult(null); }}>{item}</button>)}
        </div>

        <section className="solver-grid">
          <div className="card solver-card">
            <div className="card-title"><div><span className="eyebrow">SOLVE A PROBLEM</span><h3>{mode}</h3></div><FaCalculator /></div>
            <label>Enter your mathematics</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") solve(); }} placeholder={mode === "Equation Solver" ? "Example: 3x + 7 = 25" : "Example: 128583 - 48858"} />
            <div className="input-help">Use <b>Ctrl + Enter</b> to solve · brackets: ( ) · powers: ^ · multiplication: *</div>
            <div className="actions"><button className="primary" onClick={solve}><FaCheckCircle /> Solve</button><button className="ghost" onClick={loadExample}>Load example</button><button className="icon-button" onClick={reset} title="Clear"><FaRedo /></button></div>

            {result && <div className={`result ${result.error ? "error" : ""}`}>
              {result.error ? <><strong>Let's fix that</strong><p>{result.error}</p></> : <><span className="result-label">ANSWER</span><strong>{result.answer}</strong><div className="result-actions"><button onClick={() => setShowSteps(v => !v)}><FaLightbulb /> {showSteps ? "Hide reasoning" : "Show reasoning"}</button></div>{showSteps && <div className="steps"><h4>Step-by-step reasoning</h4>{result.steps.map((step, i) => <div className="step" key={i}><span>{i + 1}</span><p>{step}</p></div>)}</div>}</>}
            </div>}
          </div>

          <aside className="card learn-card">
            <div className="card-title"><div><span className="eyebrow">LEARN THE METHOD</span><h3>Mini lesson</h3></div><FaLightbulb /></div>
            <div className="lesson-buttons">{Object.keys(lessons).map(item => <button key={item} className={lesson === item ? "selected" : ""} onClick={() => setLesson(item)}>{item}</button>)}</div>
            <div className="lesson-content"><h4>{lessons[lesson].title}</h4><p>{lessons[lesson].text}</p><div className="lesson-example">{lessons[lesson].example}</div></div>
            <button className="practice-link" onClick={() => { setMode("Practice"); setInput(""); setResult(null); }}>Practise this concept →</button>
          </aside>
        </section>

        <section className="card practice-card">
          <div><span className="eyebrow">QUICK PRACTICE</span><h3>Try one without the calculator</h3><p>Build your mental and written-solving skills before checking the answer.</p></div>
          <div className="practice-problem">{practice.a} {practice.op} {practice.b} = ?</div>
          <button className="primary" onClick={() => { setInput(`${practice.a} ${practice.op === "×" ? "*" : practice.op} ${practice.b}`); setMode("Practice"); setResult(null); }}>Solve it</button>
          <button className="ghost" onClick={newPractice}>New problem</button>
          <details><summary>Reveal answer</summary><strong>{practice.answer}</strong></details>
        </section>
      </main>
    </div>
  );
}

export default App;
