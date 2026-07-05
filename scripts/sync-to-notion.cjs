// Synchronise une issue GitHub vers la base Notion.
// Déclenché par le workflow .github/workflows/github-to-notion.yml
// Variables d'environnement attendues (fournies par le workflow) :
//   NOTION_API_KEY, NOTION_DATABASE_ID
//   ISSUE_NUMBER, ISSUE_TITLE, ISSUE_STATE ("open"|"closed"), ISSUE_URL,
//   ISSUE_LABELS (JSON stringifié d'un tableau de strings), ISSUE_BODY, ISSUE_ACTION

const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

async function getTitlePropName() {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const entry = Object.entries(db.properties).find(([, p]) => p.type === "title");
  if (!entry) throw new Error("Aucune propriété de type 'title' trouvée dans la base Notion.");
  return entry[0];
}

async function findPageByIssueNumber(issueNumber) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Issue Number",
      number: { equals: Number(issueNumber) },
    },
  });
  return response.results[0] || null;
}

function buildProperties(titleProp) {
  const labels = JSON.parse(process.env.ISSUE_LABELS || "[]");
  const state = process.env.ISSUE_STATE === "closed" ? "Closed" : "Open";

  return {
    [titleProp]: {
      title: [{ text: { content: truncate(process.env.ISSUE_TITLE || "(sans titre)", 200) } }],
    },
    "Issue Number": {
      number: Number(process.env.ISSUE_NUMBER),
    },
    State: {
      select: { name: state },
    },
    URL: {
      url: process.env.ISSUE_URL,
    },
    Labels: {
      multi_select: labels.map((name) => ({ name: truncate(name, 100) })),
    },
    Body: {
      rich_text: [{ text: { content: truncate(process.env.ISSUE_BODY || "", 2000) } }],
    },
  };
}

async function main() {
  const action = process.env.ISSUE_ACTION;
  const existingPage = await findPageByIssueNumber(process.env.ISSUE_NUMBER);

  if (action === "deleted") {
    if (existingPage) {
      await notion.pages.update({ page_id: existingPage.id, archived: true });
      console.log(`Issue #${process.env.ISSUE_NUMBER} archivée dans Notion.`);
    }
    return;
  }

  const titleProp = await getTitlePropName();
  const properties = buildProperties(titleProp);

  if (existingPage) {
    await notion.pages.update({ page_id: existingPage.id, properties });
    console.log(`Issue #${process.env.ISSUE_NUMBER} mise à jour dans Notion.`);
  } else {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
    console.log(`Issue #${process.env.ISSUE_NUMBER} créée dans Notion.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
