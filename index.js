const core = require('@actions/core');
const github = require('@actions/github');

async function f() {
  try {
    const gh_token = core.getInput('gh_token');
    const octokit = github.getOctokit(gh_token);

    console.log(`github.context: ${JSON.stringify(github.context, undefined, 2)}`);

    // Getting SHA and branch name
    const sha = github.context.sha;
    const branch = github.context.ref.match(/^refs\/heads\/(.*)/)[1];
    console.log(`Sha: ${sha}\nBranch: ${branch}`);

    if (branch == 'master' || branch == 'main') {
      const mode = 'master/main';
    } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {
      const mode = 'release/releases';
    } else {
      core.setFailed(`No rule for brunch "${branch}"`);
    }
    console.log(`Rule for: ${mode}`);


    if (mode == 'release/releases') {
      const old_tag_a = branch.match(/^releases?\/(\d+\.\d+\.)[\dx]+$/)[1];
      console.log(`Tag series: ${old_tag_a}`);

      // Getting refs/tags
      const tags_detailt = await octokit.rest.git.listMatchingRefs({
        ...github.context.repo,
        ref: `tags/v${old_tag_a}`
      });
      const tags = tags_detailt.data;
      console.log(`Tags: ${JSON.stringify(tags, undefined, 2)}`);




    }



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

      // Getting last clear tag
      for (tag in tags) {
        console.log(tags[tag].ref);
        try {
          var old_tag = tags[tag].ref.match(/^refs\/tags\/v(\d+\.\d+)\.(\d+)$/);
          var old_tag_a = old_tag[1];
          var old_tag_b = old_tag[2];
        } catch (error) {
          continue;
        }
        console.log(`v${old_tag_a}.${old_tag_b}`);
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