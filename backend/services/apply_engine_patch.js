
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

/*
=========================================================
EduGen Safe Engine Upgrade
=========================================================
This script is located inside:

backend/services/

Therefore __dirname already points to:

backend/services/

So questionEngine.js is simply:

__dirname/questionEngine.js
=========================================================
*/

const enginePath = path.join(
  __dirname,
  "questionEngine.js"
);

const backupPath = path.join(
  __dirname,
  "questionEngine.before-upgrade.js"
);

console.log("==========================================");
console.log(" EduGen Safe Engine Upgrade");
console.log("==========================================");

/*
=========================================================
CHECK ENGINE EXISTS
=========================================================
*/

if (!fs.existsSync(enginePath)) {
  console.error("❌ questionEngine.js was not found.");
  console.error("");
  console.error("Expected location:");
  console.error(enginePath);
  process.exit(1);
}

console.log("✅ questionEngine.js found.");
console.log(enginePath);

/*
=========================================================
READ ORIGINAL ENGINE
=========================================================
*/

const original = fs.readFileSync(
  enginePath,
  "utf8"
);

/*
=========================================================
SAFETY CHECKS
=========================================================
*/

if (
  !original.includes("function generateQuestions") ||
  !original.includes("function convertToProblemSolving") ||
  !original.includes("function generateMath") ||
  !original.includes("function generateScience")
) {
  console.error(
    "❌ Safety check failed: expected functions were not found."
  );

  console.error("");
  console.error(
    "No changes were made to questionEngine.js."
  );

  process.exit(1);
}

console.log(
  "✅ Safety checks passed."
);

/*
=========================================================
BACKUP
=========================================================
*/

fs.copyFileSync(
  enginePath,
  backupPath
);

console.log("");
console.log("✅ Backup created:");
console.log(backupPath);

/*
=========================================================
HELPER
=========================================================
*/

function replaceFunction(
  source,
  functionName,
  newFunction
) {
  const startPattern =
    new RegExp(
      `function\\s+${functionName}\\s*\\(`
    );

  const match =
    source.match(startPattern);

  if (!match) {
    throw new Error(
      `Function not found: ${functionName}`
    );
  }

  const start =
    match.index;

  const braceStart =
    source.indexOf(
      "{",
      start
    );

  if (braceStart === -1) {
    throw new Error(
      `Opening brace not found: ${functionName}`
    );
  }

  let depth = 0;
  let end = -1;

  for (
    let i = braceStart;
    i < source.length;
    i++
  ) {
    const char =
      source[i];

    if (char === "{") {
      depth++;
    }

    if (char === "}") {
      depth--;

      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error(
      `Could not determine end of function: ${functionName}`
    );
  }

  return (
    source.slice(0, start) +
    newFunction.trim() +
    source.slice(end)
  );
}

/*
=========================================================
PATCH 1
PROBLEM SOLVING
=========================================================

The original answer remains internally stored.

The student receives a clear final-answer instruction.

Options remain empty.

=========================================================
*/

const newProblemSolving = `
function convertToProblemSolving(
  question
) {
  return {
    ...question,

    question:
      \`PROBLEM SOLVING\\\\n\\\\n\` +
      \`\${question.question}\\\\n\\\\n\` +
      \`Solve the problem carefully. You may show your working on paper.\\\\n\\\\n\` +
      \`FINAL ANSWER: Enter only your final answer below.\`,

    options: [],

    questionType:
      "Problem Solving",
  };
}
`;

/*
=========================================================
APPLY PATCHES
=========================================================
*/

let updated = original;

try {
  updated =
    replaceFunction(
      updated,
      "convertToProblemSolving",
      newProblemSolving
    );
} catch (error) {
  console.error("");
  console.error(
    "❌ Patch failed:"
  );
  console.error(
    error.message
  );

  console.error("");
  console.error(
    "Your original questionEngine.js was NOT changed."
  );

  process.exit(1);
}

console.log(
  "✅ Problem-solving patch prepared."
);

/*
=========================================================
WRITE TEMPORARY FILE
=========================================================
*/

const tempPath =
  enginePath + ".upgrade.tmp.js";

try {
  fs.writeFileSync(
    tempPath,
    updated,
    "utf8"
  );
} catch (error) {
  console.error("");
  console.error(
    "❌ Could not write temporary file."
  );
  console.error(error.message);

  process.exit(1);
}

console.log(
  "✅ Patch written to temporary file."
);

/*
=========================================================
SYNTAX CHECK
=========================================================
*/

console.log("");
console.log(
  "Checking JavaScript syntax..."
);

try {
  execFileSync(
    process.execPath,
    [
      "--check",
      tempPath,
    ],
    {
      stdio: "inherit",
    }
  );

  console.log(
    "✅ JavaScript syntax check passed."
  );
} catch (error) {
  console.error("");
  console.error(
    "❌ Syntax check failed."
  );

  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  console.error("");
  console.error(
    "Your original questionEngine.js was NOT changed."
  );

  process.exit(1);
}

/*
=========================================================
FINAL REPLACEMENT
=========================================================
*/

try {
  fs.renameSync(
    tempPath,
    enginePath
  );
} catch (error) {
  console.error("");
  console.error(
    "❌ Could not replace questionEngine.js."
  );

  console.error(
    error.message
  );

  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  console.error("");
  console.error(
    "Your original questionEngine.js was NOT changed."
  );

  process.exit(1);
}

/*
=========================================================
SUCCESS
=========================================================
*/

console.log("");
console.log(
  "✅ questionEngine.js updated safely."
);

console.log("");
console.log("==========================================");
console.log(" EduGen patch completed successfully.");
console.log("==========================================");

console.log("");
console.log("Backup:");
console.log(backupPath);

console.log("");
console.log("Updated engine:");
console.log(enginePath);