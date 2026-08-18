/* =========================================================
   EduGen AUTHORIZED TEXTBOOK REGISTRY
   ---------------------------------------------------------
   Registry metadata only. Do NOT store copyrighted textbook
   chapters/pages here. The generator consumes licensed or
   user-provided textbook content through textbookEngine.js.

   Source: NaCCA approved instructional resources list.
========================================================= */

const OFFICIAL_APPROVED_LIST =
  "https://nacca.gov.gh/approved-books/";

const textbooks = [
  // JHS Mathematics
  { grade: "JHS1", subject: "Mathematics", title: "A Comprehensive Approach to the New Common Core Programme Mathematics JHS 1", author: "Ruben Kofi Danquah", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "JHS2", subject: "Mathematics", title: "A Comprehensive Approach to the New Common Core Programme Mathematics JHS 2", author: "Ruben Kofi Danquah", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "JHS3", subject: "Mathematics", title: "A Comprehensive Approach to the New Common Core Programme Mathematics JHS 3", author: "Ruben Kofi Danquah", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },

  // JHS Integrated Science
  { grade: "JHS1", subject: "Integrated Science", title: "A Comprehensive Approach to the New Common Core Programme Science JHS 1", author: "Ruben Kofi Danquah", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "JHS2", subject: "Integrated Science", title: "A Comprehensive Approach to the New Common Core Programme Science JHS 2", author: "Ruben Kofi Danquah", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "JHS3", subject: "Integrated Science", title: "A Comprehensive Approach to the New Common Core Programme Science JHS 3", author: "Ruben Kofi Danquah", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },

  // SHS resources. These are approved resources, not necessarily
  // one-to-one grade textbooks; curriculum mapping remains authoritative.
  { grade: "SHS1", subject: "Physics", title: "Pre-University Physics", author: "George Sarkwa", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS2", subject: "Physics", title: "Pre-University Physics", author: "George Sarkwa", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS3", subject: "Physics", title: "Pre-University Physics", author: "George Sarkwa", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS1", subject: "Biology", title: "Biology for SHS", author: "F.T Akpaloo", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS2", subject: "Biology", title: "Biology for SHS", author: "F.T Akpaloo", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS3", subject: "Biology", title: "Biology for SHS", author: "F.T Akpaloo", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS1", subject: "Chemistry", title: "Concentrated Elective Chemistry Theory - Composite Volume", author: "Dr. G.N Doku", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS2", subject: "Chemistry", title: "Concentrated Elective Chemistry Theory - Composite Volume", author: "Dr. G.N Doku", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
  { grade: "SHS3", subject: "Chemistry", title: "Concentrated Elective Chemistry Theory - Composite Volume", author: "Dr. G.N Doku", source: OFFICIAL_APPROVED_LIST, authority: "NaCCA" },
];

function getTextbooks(grade, subject) {
  return textbooks.filter((book) =>
    (!grade || book.grade === grade) &&
    (!subject || book.subject === subject)
  );
}

module.exports = { OFFICIAL_APPROVED_LIST, textbooks, getTextbooks };
