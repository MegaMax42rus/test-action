const core = require('@actions/core');
const github = require('@actions/github');

try {
  const gh_token = core.getInput('gh_token');
  const octokit = github.getOctokit(gh_token);

  //const context = JSON.stringify(github.context, undefined, 2);
  //console.log(`github.context: ${context}`);

  const sha = github.context.sha;
  const branch = github.context.ref.match(/^refs\/heads\/(.*)/)[1];
  console.log(`Sha: ${sha} Branch: ${branch}`);

  const ref = 'tags'
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