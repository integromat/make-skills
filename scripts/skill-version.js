// Custom updater for skills/*/SKILL.md
// Handles version in YAML frontmatter at metadata.version

module.exports.readVersion = function (contents) {
  const match = contents.match(/^metadata:\s*\n(?:.*\n)*?\s+version:\s*"?([^"\n]+)"?/m);
  return match ? match[1] : undefined;
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(
    /(^metadata:\s*\n(?:.*\n)*?\s+version:\s*)"?[^"\n]+"?/m,
    `$1"${version}"`
  );
};
