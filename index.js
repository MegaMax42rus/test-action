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

function get_max_tag_match(tag_array, regex) {
  var max_tag;
  for (tag in tag_array) {
    try {
      max_tag = tag_array[tag].match(regex)[1];
    } catch (error) {
      continue;
    }
  }
  return max_tag;
}

function increment_patch(version) {
  let split_version = version.match(/v?(\d+\.\d+\.)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
}

function increment_rc(version) {
  let split_version = version.match(/v?(\d+\.\d+\.\d+-rc)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
}

function release_mode(release, version) {
  if (version) {
    //
  } else {
    let max_version_regex = new RegExp(`^(v${release.replace('.','\\.')}\\.\\d+)\\.*$`);
    let max_version = get_max_tag_match(all_tags, max_version_regex);
    console.log(`Max version: ${max_clear_version}`);

    let max_clear_version_regex = new RegExp(`^v${release.replace('.','\\.')}\\.\\d+$`);
    let max_clear_version = get_max_tag(all_tags, max_clear_version_regex);
    console.log(`Max clear version: ${max_clear_version}`);

    let max_rc_version_regex = new RegExp(`^v${release.replace('.','\\.')}\\.\\d+-rc\\d+$`);
    let max_rc_version = get_max_tag(all_tags, max_rc_version_regex);
    console.log(`Max rc version: ${max_rc_version}`);
  }
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
    if (branch == 'master' || branch == 'main') {
      console.log('Rule for: master/main');
    } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {
      console.log('Rule for: release/releases');
      let release = branch.match(/^releases?\/(\d+\.\d+)\.[\dx]+$/)[1];
      release = '1.2';
      console.log(`Release version: ${release}`);
      new_tag = release_mode(release, null);
      console.log(`New tag: ${new_tag}`)
    } else {
      core.setFailed(`No rule for brunch "${branch}"`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

f();