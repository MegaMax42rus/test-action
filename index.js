const core = require('@actions/core');
const github = require('@actions/github');

//console.log(`github.context: ${JSON.stringify(github.context, undefined, 2)}`);

function get_max_tag(tag_array, regex) {
  //console.log(regex);
  var max_tag;
  for (tag in tag_array) {
    try {
      //console.log(tag_array[tag]);
      max_tag = tag_array[tag].match(regex)[0];
    } catch (error) {
      //console.log(`ERROR: ${error}\n${tag_array[tag]}`);
      continue;
    }
  }
  return max_tag;
}

function get_max_tag_match(tag_array, regex) {
  //console.log(regex);
  var max_tag;
  for (tag in tag_array) {
    try {
      //console.log(tag_array[tag]);
      max_tag = tag_array[tag].match(regex)[1];
    } catch (error) {
      //console.log(`ERROR: ${error}\n${tag_array[tag]}`);
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

function increment_r(version) {
  let split_version = version.match(/v?(\d+\.\d+\.\d+-r)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
}

function release_mode(all_tags, release, version) {
  console.log('================================================================================');
  console.log(`DEBUG Version: ${version}`);
  if (version) {
    let max_clear_version_regex = new RegExp(`^${version.replace('.','\\.')}$`);
    let max_clear_version = get_max_tag(all_tags, max_clear_version_regex);
    console.log(`Max clear version: ${max_clear_version}`);
    let max_rc_version_regex = new RegExp(`^${version.replace('.','\\.')}-rc\\d+$`);
    let max_rc_version = get_max_tag(all_tags, max_rc_version_regex);
    console.log(`Max rc version: ${max_rc_version}`);
    if (version == max_clear_version) {
      return release_mode(all_tags, release, increment_patch(max_clear_version));
    } else {
      if (max_rc_version) {
        return increment_rc(max_rc_version);
      } else {
        return `${version}-rc0`
      }
    }
  } else {
    let max_version_regex = new RegExp(`^(v${release.replace('.','\\.')}\\.\\d+).*$`);
    let max_version = get_max_tag_match(all_tags, max_version_regex);
    console.log(`Max version: ${max_version}`);
    if (max_version) {
      return release_mode(all_tags, release, max_version);
    } else {
      return `v${release}.0-rc0`;
    }
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

    // Getting all tags and checking if no tag
    var all_tags = [];
    const all_tags_detailt = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: `tags/`
    });
    var need_add_tag = true;
    for (tag in all_tags_detailt.data) {
      all_tags.push(all_tags_detailt.data[tag].ref.match(/^refs\/tags\/(.*)/)[1]);
      if (all_tags_detailt.data[tag].object.sha == sha) {
        need_add_tag = false;
      }
    }

    if (need_add_tag) {
      console.log('NEED ADD TAG');
      if (branch == 'master' || branch == 'main') {
        console.log('Rule for: master/main');
      } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {
        console.log('Rule for: release/releases');
        let release = branch.match(/^releases?\/(\d+\.\d+)\.[\dx]+$/)[1];
        //release = '1.2';
        console.log(`Release version: ${release}`);
        new_tag = release_mode(all_tags, release, null);
        console.log(`New tag: ${new_tag}`)
      } else {
        core.setFailed(`No rule for brunch "${branch}"`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

f();