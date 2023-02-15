const core = require('@actions/core');
const github = require('@actions/github');

const gh_token = core.getInput('gh_token');
const octokit = github.getOctokit(gh_token);

try {
  const context = JSON.stringify(github.context, undefined, 2);
  console.log(`github.context: ${context}`);

  const sha = github.context.sha;
  const branch = github.context.ref.replace(/refs\/heads\//g, '');
  console.log(`Sha: ${sha} Branch: ${branch}`);

  const ref = 'tags/v1.1'
  const ref_detailt = octokit.rest.git.listMatchingRefs({
    ...github.context.repo,
    ref
  });

  ref_detailt.then(function(result) {
    //result.data.
    console.log(JSON.stringify(result, undefined, 2)) // "Some User token"
  })


} catch (error) {
  core.setFailed(error.message);
}