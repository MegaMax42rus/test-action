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

    // Getting all tags
    var all_tags = [];
    const all_tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: `tags/v`
    });

    for (tag in all_tags_detailt.data) {
      all_tags.push(all_tags_detailt.data[tag].ref);
      console.log(all_tags[tag]);
    }







    var mode;
    var release;
    if (branch == 'master' || branch == 'main') {
      mode = 'master/main';
      console.log(`Rule for: ${mode}`);
    } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {
      mode = 'release/releases';
      release = branch.match(/^releases?\/(\d+\.\d+\.)[\dx]+$/)[1];
      console.log(`Rule for: ${mode}\nRelease: ${release}x`);
    } else {
      core.setFailed(`No rule for brunch "${branch}"`);
    }

    // Getting refs/tags
    const tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: `tags/v${release}`
    });
    const tags = tags_detailt.data;
    console.log(`Tags: ${JSON.stringify(tags, undefined, 2)}`);

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