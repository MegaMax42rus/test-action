const core = require('@actions/core');
const github = require('@actions/github');
const debug = true;

//console.log(`github.context: ${JSON.stringify(github.context, undefined, 2)}`);

function get_max_tag(tag_array, regex) {
  var max_tag;
  for (tag in tag_array) {
    try {
      max_tag = tag_array[tag].match(regex)[0];
    } catch (error) {
      continue;
    }
  }
  return max_tag;
}

async function f() {
  try {
    const gh_token = core.getInput('gh_token');
    const octokit = github.getOctokit(gh_token);

    // Getting SHA and branch name
    const sha = github.context.sha;
    const branch = github.context.ref.match(/^refs\/heads\/(.*)/)[1];
    console.log(`Sha: ${sha}\nBranch: ${branch}`);

    // Getting all tags
    var all_tags = [];
    const all_tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: `tags/`
    });
    for (tag in all_tags_detailt.data) {
      all_tags.push(all_tags_detailt.data[tag].ref.match(/^refs\/tags\/(.*)/)[1]);
      if (debug) {
        let tag_sha = all_tags_detailt.data[tag].object.sha;
        console.log(`${all_tags[tag]} (${tag_sha})`);
      }
    }

    // Select mode
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

    if (mode == 'release/releases') {
      console.log('Enter in release/releases mode')
      let max_rc_vercion = get_max_tag(all_tags, /v\d+\.\d+\.\d+-rc\d+$/)
      if (max_rc_vercion) {
        console.log(`Max rc vercion: ${max_rc_vercion}`);
        let max_clear_vercion = get_max_tag(all_tags, /v\d+\.\d+\.\d+$/)
        console.log(`Max clear vercion: ${max_clear_vercion}`);
      }
    }








  } catch (error) {
    core.setFailed(error.message);
  }
}

f();