// Relit la base Notion (toutes les pages) et pousse titre / état / labels
// vers les issues GitHub correspondantes si elles diffèrent.
// Déclenché par le workflow .github/workflows/notion-to-github.yml (cron)
// Variables d'environnement attendues :
//   NOTION_API_KEY, NOTION_DATABASE_ID
//   GITHUB_TOKEN, GITHUB_REPOSITORY (fourni automatiquement par Actions, format "owner/repo")

const { Client } = require("@notionhq/client");
const { Octokit } = require("@octokit/rest");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

// Doit rester IDENTIQUE à sync-to-notion.cjs : marqueur ajouté par ce dernier
// quand un corps trop long (>~40 000 caractères) a été tronqué côté Notion.
const BODY_TRUNCATION_NOTE = "(...) contenu tronqué, voir l'issue GitHub";

function getTitle(page) {
  const prop = Object.values(page.properties).find((p) => p.type === "title");
  return prop?.title?.[0]?.plain_text || "";
}

function getIssueNumber(page) {
  return page.properties["Issue Number"]?.number ?? null;
}

function getState(page) {
  const name = page.properties["State"]?.select?.name;
  return name === "Closed" ? "closed" : "open";
}

function getLabels(page) {
  return (page.properties["Labels"]?.multi_select || []).map((l) => l.name);
}

// Reconstruit le corps complet en concaténant tous les blocs rich_text dans
// l'ordre, sans séparateur — symétrique du découpage de sync-to-notion.cjs.
function getBody(page) {
  const blocks = page.properties["Body"]?.rich_text || [];
  return blocks.map((b) => b.plain_text ?? b.text?.content ?? "").join("");
}

async function fetchAllNotionPages() {
  const pages = [];
  let cursor = undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function sameLabels(a, b) {
  const sa = [...a].sort().join(",");
  const sb = [...b].sort().join(",");
  return sa === sb;
}

async function main() {
  const pages = await fetchAllNotionPages();

  for (const page of pages) {
    const issueNumber = getIssueNumber(page);
    if (!issueNumber) continue; // ligne créée manuellement sans lien vers une issue, on ignore

    let issue;
    try {
      const res = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
      issue = res.data;
    } catch (err) {
      console.warn(`Issue #${issueNumber} introuvable sur GitHub, ignorée.`);
      continue;
    }

    const notionTitle = getTitle(page);
    const notionState = getState(page);
    const notionLabels = getLabels(page);
    const notionBody = getBody(page);
    const githubBody = issue.body || "";

    // Si le corps Notion se termine par le marqueur de troncature, il est
    // incomplet (issue >~40k caractères) : GitHub reste la source de vérité,
    // on ne réécrit pas le corps pour ne pas perdre de contenu.
    const bodyDiffers =
      !notionBody.endsWith(BODY_TRUNCATION_NOTE) && notionBody !== githubBody;

    const needsUpdate =
      (notionTitle && notionTitle !== issue.title) ||
      notionState !== issue.state ||
      !sameLabels(notionLabels, issue.labels.map((l) => (typeof l === "string" ? l : l.name))) ||
      bodyDiffers;

    if (!needsUpdate) continue;

    const update = {
      owner,
      repo,
      issue_number: issueNumber,
      title: notionTitle || issue.title,
      state: notionState,
      labels: notionLabels,
    };
    if (bodyDiffers) update.body = notionBody;

    await octokit.issues.update(update);

    console.log(`Issue #${issueNumber} mise à jour sur GitHub depuis Notion.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
