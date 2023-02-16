const core = require('@actions/core');
const github = require('@actions/github');

async function f() {
  try {
    const gh_token = core.getInput('gh_token');
    const octokit = github.getOctokit(gh_token);

    //const context = JSON.stringify(github.context, undefined, 2);
    //console.log(`github.context: ${context}`);

    const sha = github.context.sha;
    const branch = github.context.ref.match(/^refs\/heads\/(.*)/)[1];
    console.log(`Sha: ${sha}\nBranch: ${branch}`);

    // Get refs/tags
    const tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: 'tags'
    });
    const tags = tags_detailt.data;

    for (tag in tags) {
      console.log(tags[tag])
      if (tags[tag].object.sha == sha) {
        console.log('XXXXXXXXXXXXXXXXXxx')
      }
    }

    //console.log(JSON.stringify(tags, undefined, 2));


  } catch (error) {
    core.setFailed(error.message);
  }
}

f();