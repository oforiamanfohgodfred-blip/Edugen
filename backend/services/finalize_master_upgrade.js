const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const services = __dirname;
const patch = path.join(services, "apply_engine_patch.js");
const engine = path.join(services, "questionEngine.js");

console.log("==========================================");
console.log(" EduGen ONE-COMMAND MASTER UPGRADE");
console.log("==========================================");

execFileSync(process.execPath, [patch], { stdio: "inherit" });

let source = fs.readFileSync(engine, "utf8");
source = source.replace(
  'const { getKnowledgeContext } = require("./textbookEngine");',
  'const { getKnowledgeContext } = require("./textbookAdapter");'
);

const oldBankLine = `  const subjectBank =\n    scienceBanks[subject];`;
const newBankLine = `  const subjectBank =\n    subject === "Integrated Science"\n      ? Object.assign({}, ...Object.values(scienceBanks))\n      : scienceBanks[subject];`;
if (source.includes(oldBankLine)) {
  source = source.replace(oldBankLine, newBankLine);
} else if (!source.includes('subject === "Integrated Science"')) {
  throw new Error("Could not locate science bank routing line; refusing to continue.");
}

// Never return raw textbook excerpts to the frontend/API response.
source = source.replace(/,\n\s*textbookContext:\n\s*textbook\.context \|\| null/, "");

const temp = `${engine}.finalizer.tmp.js`;
fs.writeFileSync(temp, source, "utf8");
execFileSync(process.execPath, ["--check", temp], { stdio: "inherit" });
fs.renameSync(temp, engine);

console.log("==========================================");
console.log(" ✅ MASTER UPGRADE COMPLETE");
console.log("==========================================");
console.log("Curriculum: JHS1-JHS3 + SHS1-SHS3");
console.log("Subjects: Math + JHS Integrated Science + SHS Physics/Chemistry/Biology");
console.log("University: removed");
console.log("Question types: MCQ + Short Answer + Problem Solving + True/False + Word Problems + Mixed");
console.log("Textbook adapter: enabled");
console.log("Integrated Science bank: enabled");
console.log("Duplicate protection: enabled");
console.log("Requested-count protection: enabled");
console.log("Expert reasoning profiles: enabled");
console.log("==========================================");
