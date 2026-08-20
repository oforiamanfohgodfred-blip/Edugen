/* EduGen stable generation facade.
   Textbooks are optional references. Generation must remain independent of books. */
const crypto = require("crypto");
const curriculum = require("./curriculumEngine");
const science = require("./integratedScienceGeneratorV2");
const physics = require("./shsPhysicsEngine");
const expert = require("./expertQuestionEngine");

const id = () => crypto.randomBytes(8).toString("hex");
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const fmt = (n) => Number.isInteger(n) ? String(n) : Number(n.toFixed(2)).toString();

function mcq(subject, grade, topic, difficulty, question, answer, distractors, family, explanation) {
  return {
    id: id(), subject, grade, level: grade, topic, difficulty,
    questionFamily: family || "application", question,
    options: [answer, ...distractors].filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5),
    answer, correctAnswer: answer, questionType: "Multiple Choice",
    explanation: explanation || `The correct answer is ${answer}.`,
    learningObjective: `Apply knowledge of ${topic}.`,
  };
}

function mathFallback(grade, topic, difficulty, family) {
  const t = clean(topic);
  if (t.includes("percentage") || t.includes("financial")) { const base = ri(80,900), pct=ri(5,35), value=base*pct/100; return mcq("Mathematics",grade,topic,difficulty,`A quantity is ${base}. What is ${pct}% of it?`,fmt(value),[fmt(base+value),fmt(base-pct),fmt(value+pct)],"calculation",`${pct}/100 × ${base} = ${fmt(value)}.`); }
  if (t.includes("ratio") || t.includes("proportion")) { const a=ri(2,9),b=ri(3,12),k=ri(3,15); return mcq("Mathematics",grade,topic,difficulty,`Two quantities are in the ratio ${a}:${b}. If the first quantity is ${k*a}, what is the second?`,String(k*b),[String(k*a),String(b+k),String(k*a+b)],"ratio-application",`${a}:${b} scales by ${k}.`); }
  if (t.includes("probability")) { const total=ri(8,30),favorable=ri(1,total-1); return mcq("Mathematics",grade,topic,difficulty,`A random selection has ${favorable} favourable outcomes out of ${total} equally likely outcomes. What is the probability of success?`,`${favorable}/${total}`,[`${total}/${favorable}`,`${favorable+1}/${total}`,`${favorable}/${total+1}`],"probability",`Probability = favourable outcomes / total outcomes.`); }
  if (t.includes("statistics") || t.includes("data")) { const nums=[ri(4,20),ri(4,20),ri(4,20),ri(4,20),ri(4,20)],mean=nums.reduce((a,b)=>a+b,0)/5; return mcq("Mathematics",grade,topic,difficulty,`The values are ${nums.join(", ")}. What is their mean?`,fmt(mean),[fmt(mean+1),fmt(mean-1),fmt(nums[0])],"data-interpretation",`Add the values and divide by 5.`); }
  if (t.includes("quadratic")) { const r1=ri(-9,9),r2=ri(-9,9),b=-(r1+r2),c=r1*r2; return mcq("Mathematics",grade,topic,difficulty,`For x² ${b>=0?"+":"−"} ${Math.abs(b)}x ${c>=0?"+":"−"} ${Math.abs(c)} = 0, what is the sum of the roots?`,String(r1+r2),[String(r1*r2),String(Math.abs(r1-r2)),String(-(r1*r2))],"quadratic-reasoning",`For x² + bx + c = 0, the sum of roots is −b.`); }
  if (t.includes("linear") || t.includes("algebra") || t.includes("equation")) { const x=ri(-20,40),a=ri(2,12),b=ri(-20,30),rhs=a*x+b; return mcq("Mathematics",grade,topic,difficulty,`Solve ${a}x ${b>=0?"+":"−"} ${Math.abs(b)} = ${rhs}.`,String(x),[String(x+1),String(x-1),String(-x)],"algebra",`Subtract ${b} and divide by ${a}.`); }
  if (t.includes("sequence") || t.includes("series") || t.includes("pattern")) { const first=ri(2,20),d=ri(2,12),n=ri(5,18),ans=first+(n-1)*d; return mcq("Mathematics",grade,topic,difficulty,`An arithmetic sequence starts at ${first} and increases by ${d}. What is its ${n}th term?`,String(ans),[String(ans+d),String(ans-d),String(first+n*d)],"sequence",`aₙ = a + (n−1)d.`); }
  if (t.includes("indices") || t.includes("surds") || t.includes("logarithm")) { const a=ri(2,6),n=ri(2,5),ans=Math.pow(a,n); return mcq("Mathematics",grade,topic,difficulty,`Evaluate ${a}^${n}.`,String(ans),[String(a*n),String(ans+a),String(Math.max(1,ans-a))],"indices",`${a}^${n} = ${ans}.`); }
  if (t.includes("geometry") || t.includes("angle") || t.includes("shape") || t.includes("mensuration") || t.includes("area") || t.includes("volume")) { const l=ri(4,30),w=ri(3,20),area=l*w; return mcq("Mathematics",grade,topic,difficulty,`A rectangle has length ${l} cm and width ${w} cm. What is its area?`,`${area} cm²`,[`${2*(l+w)} cm`,`${l+w} cm²`,`${area+w} cm²`],"geometry",`Area = length × width.`); }
  if (t.includes("vector") || t.includes("coordinate")) { const x1=ri(-10,10),x2=ri(-10,10),y1=ri(-10,10),y2=ri(-10,10); return mcq("Mathematics",grade,topic,difficulty,`Point A is (${x1}, ${y1}) and point B is (${x2}, ${y2}). What is the change in x-coordinate from A to B?`,String(x2-x1),[String(x1-x2),String(x2+x1),String(y2-y1)],"coordinate-application"); }
  const a=ri(3,80),b=ri(2,40); return mcq("Mathematics",grade,topic,difficulty,`A quantity related to ${topic} is ${a}. It changes by ${b}. What is the resulting value?`,String(a+b),[String(a-b),String(a*b),String(a+b+2)],family||"application",`${a} + ${b} = ${a+b}.`);
}

function fallback(subject,grade,topic,difficulty,family) {
  if (subject === "Mathematics") return mathFallback(grade,topic,difficulty,family);
  if (subject === "Integrated Science") return mcq(subject,grade,topic,difficulty,`An investigation related to ${topic} records a change from one state to another. Which principle should be used to explain the observation?`,`Use the relevant ${topic} principle and connect the observed change to its mechanism.`,["Choose an explanation unrelated to the evidence","Treat the observation as proof of every possible cause","Ignore the conditions of the investigation"],"concept-application");
  if (subject === "Physics") { const u=ri(5,30),time=ri(2,12),distance=u*time; return mcq(subject,grade,topic,difficulty,`An object moves at ${u} m/s for ${time} s. Assuming constant speed, what distance does it cover?`,`${distance} m`,[`${u+time} m`,`${distance+u} m`,`${Math.max(1,distance-time)} m`],"calculation",`d = vt.`); }
  if (subject === "Chemistry") { const p=ri(6,30),e=ri(Math.max(1,p-3),p+3),charge=p-e,ans=charge>0?`+${charge}`:String(charge); return mcq(subject,grade,topic,difficulty,`An atom has ${p} protons and ${e} electrons. What is its net charge?`,ans,[String(-charge),"0",`+${p}`],"atomic-calculation",`Net charge = protons − electrons.`); }
  if (subject === "Biology") return mcq(subject,grade,topic,difficulty,`A biological observation related to ${topic} changes after one condition is altered. What should be established before claiming causation?`,`Control plausible confounding factors and identify a mechanism linking the changed condition to the observed biological response.`,["Assume correlation proves causation","Ignore alternative explanations","Use only the first observation"],"causal-inference");
  return null;
}

function one(subject,grade,topic,difficulty,family) {
  if (String(difficulty).toLowerCase() === "expert") return expert.generateExpertQuestion({subject,grade,topic});
  if (subject === "Integrated Science") { try { const x=science.generateJHSIntegratedScienceQuestion({grade,topic,difficulty,family}); if (x) return x; } catch (_) {} }
  if (subject === "Physics") { try { const x=physics.generateSHSPhysicsQuestion({grade,topic,difficulty,family}); if (x) return x; } catch (_) {} }
  return fallback(subject,grade,topic,difficulty,family);
}

function generateQuestions({subject,topic,level,grade,difficulty="Medium",count=5}) {
  const checked=curriculum.validateRequest({grade:grade||level,subject,topic});
  if (!checked.valid) { const e=new Error(checked.message); e.code=checked.code; e.details=checked; throw e; }
  const requested=Math.min(Math.max(parseInt(count,10)||5,1),50),result=[],seen=new Set();
  const families=["concept","application","calculation","comparison","cause-effect","data-interpretation","investigation","misconception","expert-reasoning"];
  let attempts=0;
  while(result.length<requested && attempts++<Math.max(1000,requested*300)) {
    const currentFamily=pick(families), item=one(checked.subject,checked.grade,checked.topic,difficulty,currentFamily);
    if(!item || !item.question) continue;
    const key=clean(item.question); if(seen.has(key)) continue; seen.add(key);
    result.push({...item,id:item.id||id(),subject:checked.subject,grade:checked.grade,level:checked.grade,topic:checked.topic,difficulty});
  }
  return result;
}

module.exports={generateQuestions};
