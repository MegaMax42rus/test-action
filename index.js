const core = require('@actions/core');
const github = require('@actions/github');

const gh_token = core.getInput('gh_token');
const octokit = github.getOctokit(gh_token);

try {
  console.log(`Hello ${gh_token}!`);

  const payload = JSON.stringify(github.context, undefined, 2);
  console.log(`github.context: ${payload}`);

  const sha = github.context.sha;
  const ref = github.context.ref.replace(/refs\//g, '');
  console.log(`Sha: ${sha} Ref: ${ref}`);

  const ref_detailt = octokit.rest.git.getRef({
    ...github.context.repo,
    ref,
  });
  const ref_detailt_2 = JSON.stringify(ref_detailt, undefined, 2);
  console.log(ref_detailt_2);


} catch (error) {
  core.setFailed(error.message);
}