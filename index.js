const core = require('@actions/core');
const github = require('@actions/github');

async function f() {
  try {
    const gh_token = core.getInput('gh_token');
    const octokit = github.getOctokit(gh_token);

    const context = JSON.stringify(github.context, undefined, 2);
    console.log(`github.context: ${context}`);

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
    console.log(`tags: ${tags}`);



    // Checking if no tag
    var need_add_tag = true;
    for (tag in tags) {
      if (tags[tag].object.sha == sha) {
        need_add_tag = false;
      }
    }



    // Getting the value of the last tag
    if (need_add_tag) {
      console.log('NEED ADD TAG');
      if (branch == 'master' || branch == 'main') {
        tag_ref_regex = /^refs\/tags\/v(\d+\.\d+\.)(\d+)$/;
        console.log('Rule for: master/main');
      } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {

        tag_ref_regex = /^refs\/tags\/v(\d+\.\d+\.\d+-rc)(\d+)$/;
        console.log('Rule for: release/releases');
      } else {
        core.setFailed(`No rule for brunch "${branch}"`);
      }

      for (tag in tags) {
        console.log(tags[tag].ref);
        try {
          var old_tag = tags[tag].ref.match(/^refs\/tags\/v(\d+\.\d+\.\d+)$/)[1];
        } catch (error) {
          continue;
        }
        console.log(`v${old_tag}`);
      }
      console.log(`Old tag: v${old_tag}`);

      for (tag in tags) {
        try {
          var tag_ref_a = tags[tag].ref.match(tag_ref_regex)[1];
          var tag_ref_b = tags[tag].ref.match(tag_ref_regex)[2];
        } catch (error) {
          continue;
        }
        console.log(`v${tag_ref_a}${tag_ref_b}`);
      }
      var new_tag = `New tag: v${tag_ref_a}${parseInt(tag_ref_b)+1}`
      console.log(new_tag);
    }



    //console.log(JSON.stringify(tags, undefined, 2));



  } catch (error) {
    core.setFailed(error.message);
  }
}

f();