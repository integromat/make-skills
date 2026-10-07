import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

// Skills and the Make MCP server are declared in openclaw.plugin.json;
// there is no runtime code to register.
export default definePluginEntry({
  id: "make",
  name: "Make",
  description: "Build, run, and debug Make automation scenarios via the official Make MCP server and skills.",
  register() {},
});
