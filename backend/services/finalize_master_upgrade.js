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
console.log("Duplicate protection: enabled");
console.log("Requested-count protection: enabled");
console.log("Expert reasoning profiles: enabled");
console.log("==========================================");
