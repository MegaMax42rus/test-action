const core = require('@actions/core');
const github = require('@actions/github');

async function f() {
  try {
    const gh_token = core.getInput('gh_token');
    const octokit = github.getOctokit(gh_token);

    //const context = JSON.stringify(github.context, undefined, 2);
    //console.log(`github.context: ${context}`);

    // Getting SHA and branch name
    const sha = github.context.sha;
    const branch = github.context.ref.match(/^refs\/heads\/(.*)/)[1];
    console.log(`Sha: ${sha}\nBranch: ${branch}`);



    // Getting refs/tags
    const tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: 'tags'
    });
    const tags = tags_detailt.data;



    // Checking if a tag needs to be added 
    var need_add_tag = true;
    for (tag in tags) {
      if (tags[tag].object.sha == sha) {
        need_add_tag = false;
      }
    }



    // Getting the value of the last tag
    if (need_add_tag) {
      if (branch == 'master' || branch == 'main') {
        tag_ref_regex = /^refs\/tags\/v(\d+\.\d+\.\d+)$/;
        console.log('master/main');
      }
      if (branch.search(/release\//) >= 0 || branch.search(/releases\//) >= 0) {
        tag_ref_regex = /^refs\/tags\/v(\d+\.\d+\.\d+-rc\d+)$/;
        console.log('release/releases');
      }
      console.log('NEED ADD TAG');
      for (tag in tags) {
        try {
          var tag_ref = tags[tag].ref.match(tag_ref_regex)[1];
        } catch (error) {
          continue;
        }
        console.log(tag_ref);
      }
      console.log(tag_ref);
    }



    //console.log(JSON.stringify(tags, undefined, 2));



  } catch (error) {
    core.setFailed(error.message);
  }
}

f();