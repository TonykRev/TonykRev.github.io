import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const contentDirectory = resolve(process.argv[2] ?? "src/content/research");
const errors = [];

function report(file, message) {
  errors.push(`${relative(process.cwd(), file) || file}: ${message}`);
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    } else {
      report(path, "research content must be a regular file");
    }
  }

  return files;
}

function splitFrontmatter(file, source) {
  const match = source.match(/^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) {
    report(file, "a YAML frontmatter block is required");
    return null;
  }

  return { frontmatter: match[1], body: source.slice(match[0].length) };
}

function validateDraft(file, frontmatter) {
  const draftLines = frontmatter
    .split(/\r?\n/)
    .filter((line) => /^draft\s*:/.test(line));
  const isExplicitBoolean =
    draftLines.length === 1 && /^draft\s*:\s*(?:true|false)\s*(?:#.*)?$/.test(draftLines[0]);

  if (!isExplicitBoolean) {
    report(file, "draft must be explicitly set to true or false");
  }
}

function maskCode(body) {
  const lines = body.split(/(?<=\n)/);
  let fence = null;
  let masked = "";

  for (const line of lines) {
    if (fence) {
      const closingFence = new RegExp(`^[ \\t]{0,3}${fence.character}{${fence.length},}[ \\t]*(?:\\r?\\n)?$`);
      if (closingFence.test(line)) fence = null;
      masked += line.replace(/[^\r\n]/g, " ");
      continue;
    }

    const openingFence = line.match(/^[ \t]{0,3}(`{3,}|~{3,})/);
    if (openingFence) {
      fence = { character: openingFence[1][0], length: openingFence[1].length };
      masked += line.replace(/[^\r\n]/g, " ");
      continue;
    }

    masked += line;
  }

  return masked.replace(/(`+)([^\n]*?)\1/g, (match) => match.replace(/[^\r\n]/g, " "));
}

function decodeEntities(value) {
  const named = { amp: "&", colon: ":", newline: "\n", tab: "\t" };
  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));?/gi, (match, decimal, hex, name) => {
    if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    return named[name.toLowerCase()] ?? match;
  });
}

function normalizedScheme(destination) {
  let decoded = decodeEntities(destination.trim());
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // A malformed percent escape cannot turn into a recognized URI scheme.
  }
  return decoded.replace(/[\u0000-\u0020\u007f]+/g, "").match(/^([a-z][a-z\d+.-]*):/i)?.[1];
}

function markdownDestinations(body) {
  const destinations = [];
  const patterns = [
    /\]\(\s*(?:<([^>\n]*)>|([^\s)]*))/g,
    /^[ \t]{0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]*)>|(\S+))/gm,
    /<([a-z][a-z\d+.-]*:[^<>\s]*)>/gi,
  ];

  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      destinations.push(match[1] ?? match[2]);
    }
  }

  return destinations;
}

function validateBody(file, body) {
  const withoutCode = maskCode(body);
  const rawHtml = /<!--|<\?|<!|<\/?[A-Za-z][A-Za-z\d-]*(?:\s[^<>]*?)?\/?\s*>/;

  if (rawHtml.test(withoutCode)) {
    report(file, "raw HTML is not allowed; use Markdown constructs instead");
  }

  for (const destination of markdownDestinations(withoutCode)) {
    const scheme = normalizedScheme(destination);
    if (scheme && !["http", "https", "mailto", "tel"].includes(scheme.toLowerCase())) {
      report(file, `unsafe URL scheme is not allowed: ${scheme}`);
    }
  }
}

let files = [];
try {
  files = await collectFiles(contentDirectory);
} catch (error) {
  console.error(`Cannot validate research content: ${error.message}`);
  process.exitCode = 1;
}

for (const file of files) {
  if (extname(file).toLowerCase() !== ".md") {
    report(file, "only .md files are allowed in research content");
    continue;
  }

  const source = await readFile(file, "utf8");
  const sections = splitFrontmatter(file, source);
  if (!sections) continue;
  validateDraft(file, sections.frontmatter);
  validateBody(file, sections.body);
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else if (process.exitCode !== 1) {
  console.log(`Validated ${files.length} research Markdown file${files.length === 1 ? "" : "s"}`);
}
