/* =========================================================
   EduGen Curriculum Topic Router
   ---------------------------------------------------------
   Resolves common user/frontend topic wording to the exact
   curriculum topic while preserving grade-specific routing.
========================================================= */

const { getTopicsForSubject, normalizeGrade, normalizeSubject } = require("./curriculumEngine");

function clean(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

const ALIASES = {
  "whole numbers": "Whole Numbers and Place Value",
  "place value": "Whole Numbers and Place Value",
  "fractions": "Fractions",
  "decimals": "Decimals",
  "percent": "Percentages",
  "percentage": "Percentages",
  "linear equations": "Simple Linear Equations",
  "simultaneous equations": "Linear and Simultaneous Equations",
  "indices": "Indices",
  "exponents": "Indices",
  "powers": "Indices",
  "geometry": "Plane Shapes",
  "area": "Perimeter Area and Volume",
  "volume": "Perimeter Area and Volume",
  "probability": "Probability",
  "statistics": "Statistics",
  "data": "Data Collection and Representation",
  "trig": "Trigonometry",
  "trigonometry": "Trigonometry",
  "logs": "Logarithms",
  "logarithms": "Logarithms",
  "motion": "Kinematics",
  "mechanics": "Dynamics",
  "forces": "Dynamics",
  "work energy power": "Work Energy and Power",
  "heat": "Heat and Temperature",
  "electricity": "Current Electricity",
  "circuits": "DC Circuits",
  "waves": "Waves",
  "sound": "Sound",
  "optics": "Optics",
  "light": "Optics",
  "atomic structure": "Atomic Structure",
  "bonding": "Chemical Bonding",
  "mole": "Mole Concept and Stoichiometry",
  "stoichiometry": "Mole Concept and Stoichiometry",
  "organic": "Organic Chemistry",
  "cells": "Cell Structure and Function",
  "cell": "Cell Structure and Function",
  "genetics": "Genetics and Inheritance",
  "inheritance": "Genetics and Inheritance",
  "ecology": "Ecology",
  "reproduction": "Reproduction",
};

function score(candidate, target) {
  const c = clean(candidate);
  const t = clean(target);
  if (c === t) return 100;
  if (c.includes(t) || t.includes(c)) return 80;
  const a = new Set(c.split(" "));
  const b = t.split(" ");
  const overlap = b.filter((word) => a.has(word)).length;
  return overlap ? Math.round((overlap / Math.max(a.size, b.length)) * 70) : 0;
}

function resolveTopic(grade, subject, topic) {
  const g = normalizeGrade(grade);
  const s = normalizeSubject(subject);
  const topics = getTopicsForSubject(g, s);
  if (!topics.length) return null;
  const raw = clean(topic);
  if (!raw) return null;

  const alias = ALIASES[raw];
  if (alias && topics.includes(alias)) return alias;

  const ranked = topics
    .map((candidate) => ({ candidate, score: score(candidate, raw) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0] && ranked[0].score >= 35 ? ranked[0].candidate : null;
}

function getTopicCandidates(grade, subject, topic) {
  const g = normalizeGrade(grade);
  const s = normalizeSubject(subject);
  const topics = getTopicsForSubject(g, s);
  const raw = clean(topic);
  return topics
    .map((candidate) => ({ candidate, score: score(candidate, raw) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.candidate);
}

module.exports = { resolveTopic, getTopicCandidates };
