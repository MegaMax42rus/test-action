const core = require('@actions/core');
const github = require('@actions/github');

const gh_token = core.getInput('gh_token');
const octokit = github.getOctokit(gh_token);

try {
  console.log(`Hello ${gh_token}!`);

  const payload = JSON.stringify(github.context, undefined, 2);
  console.log(`github.context: ${payload}`);

  const after = github.context.payload.after;
  const ref = github.context.payload.ref;
  console.log(`After: ${after} Ref: ${ref}`);


} catch (error) {
  core.setFailed(error.message);
}