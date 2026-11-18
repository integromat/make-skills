// OpenCode server plugin: registers Make's MCP server and every published skill.
// OpenCode loads a package's "./server" export as the plugin's server part. The plugin
// object is exported as-is (`Plugin.define` from @opencode/plugin only returns its input),
// so the package needs no OpenCode dependency.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MCP_SERVER = 'make';
const MCP_URL = 'https://mcp.make.com/v2';
const root = new URL('..', import.meta.url);

/** Splits SKILL.md into its top-level frontmatter keys and the Markdown body OpenCode expects as content. */
function parseSkill(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return undefined;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([\w-]+):\s*(.*)$/);
    if (field) fields[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return { fields, content: match[2] };
}

function publishedSkills() {
  const { skills } = JSON.parse(readFileSync(new URL('skills.json', root), 'utf8'));
  return Object.entries(skills)
    .filter(([, flags]) => flags.publish)
    .flatMap(([id]) => {
      // An absolute SKILL.md path makes OpenCode treat its folder as the skill's base directory,
      // so relative links to references/ and examples/ resolve.
      const path = fileURLToPath(new URL(`skills/${id}/SKILL.md`, root));
      const parsed = parseSkill(readFileSync(path, 'utf8'));
      if (!parsed) return [];
      return [{ id, name: parsed.fields.name ?? id, description: parsed.fields.description, path, content: parsed.content }];
    });
}

export default {
  id: 'make.skills',
  async setup(ctx) {
    // A user's own `make` server entry wins, e.g. one pointing at another Make zone.
    await ctx.mcp.transform((editor) => {
      if (!editor.get(MCP_SERVER)) editor.set(MCP_SERVER, { type: 'remote', url: MCP_URL });
    });
    const skills = publishedSkills();
    await ctx.skill.transform((editor) => {
      for (const skill of skills) if (!editor.get(skill.id)) editor.add(skill);
    });
  },
};
