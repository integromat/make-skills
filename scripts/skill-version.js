// Custom updater for skills/*/SKILL.md
// Handles version in YAML frontmatter at metadata.version

function extractFrontmatter(contents) {
  const match = contents.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

module.exports.readVersion = function (contents) {
  const fm = extractFrontmatter(contents);
  if (!fm) return undefined;
  const match = fm.match(/^metadata:\s*\n(?:.*\n)*?\s+version:\s*"?([^"\n]+)"?/m);
  return match ? match[1] : undefined;
};

module.exports.writeVersion = function (contents, version) {
  const fm = extractFrontmatter(contents);
  if (!fm) throw new Error('No YAML frontmatter found in SKILL.md');
  const updated = fm.replace(
    /(^metadata:\s*\n(?:.*\n)*?\s+version:\s*)"?[^"\n]+"?/m,
    `$1"${version}"`
  );
  if (updated === fm) throw new Error('metadata.version not found in frontmatter');
  return contents.replace(fm, updated);
};
