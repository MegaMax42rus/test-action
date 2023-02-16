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

  // Get refs/tags
  var tags
  const tags_ref = 'tags'

  (async () => {
    const tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      tags_ref
    });
    tags = result.data;
    console.log(tags_detailt);
  })();




  //tags_detailt.then(function(result) {
  //  tags = result.data;
  //})

  

  console.log(JSON.stringify(tags, undefined, 2));


} catch (error) {
  core.setFailed(error.message);
}