// Custom updater for .claude-plugin/marketplace.json
// Handles nested version at .plugins[0].version

module.exports.readVersion = function (contents) {
  return JSON.parse(contents).plugins[0].version;
};

module.exports.writeVersion = function (contents, version) {
  const json = JSON.parse(contents);
  json.plugins[0].version = version;
  return JSON.stringify(json, null, 2) + "\n";
};
