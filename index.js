const core = require('@actions/core');
const github = require('@actions/github');
// const wait = require('./wait');

// most @actions toolkit packages have async methods
async function run() {
  // check that the input label exists and is reason the action is triggered
  const label = core.getInput('label');
  if (github.context.payload.label.name != label) {
    console.log(`Input label ${label} not found. Bailing.`);
    return;
  }

  // get the issue from the payload
  const issue = github.context.payload.issue
  if (!issue) {
    core.setFailed("No issue found on Actions context");
    return;
  }

  // need a token to init the client
  const token = core.getInput('github_token', { required: true });
  if (!token) {
    core.setFailed("No GITHUB_TOKEN environment variable found");
    return;
  }

  // build an array of repos like {owner, name}
  const reposRaw = core.getInput('repos');
  const nwoList = reposRaw.split(',');
  if (nwoList.length == 0) {
    core.setFailed('Missing required repos input');
    return;
  }
  var repos = [];
  for (let i = 0; i < nwoList.length; i++) {
    const parts = nwoList[i].split('/');
    if (parts.length == 2) {
      repos.push({owner: parts[0], name: parts[1]});
    }
  }

  // collect a list of checklists to append to the parent issue
  var checklists = []
  
  // create child issues in each repository
  const client = new github.GitHub(token);
  for (let i = 0; i < repos.length; i++) {
    try {
      const issueCreateResponse = await client.issues.create({
        owner: repos[i].owner,
        repo: repos[i].name,
        title: issue.title,
        body: `Child task of ${issue.html_url}`,
        labels: core.getInput('add-labels').split(',').map(l => {name: l})
      });
      console.log(`Created issue: ${issueCreateResponse.data.html_url}`);
      checklists.push(`- [ ] ${issueCreateResponse.data.html_url}`);
    } catch (error) {
      core.error(`Failed to create child issue: ${error}`);
    }
  }

  try {
    await client.issues.update({
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      issue_number: issue.number,
      body: issue.body.concat(`\n\n<hr />\n\n#### Child issues\n\n${checklists.join('\n')}`),
      // remove the input label from the issue
      labels: issue.labels.filter(l => l.name != label)
    })
  } catch (error) {
    core.setFailed(`Failed updating parent issue: ${error}`)
  }
}

run()
