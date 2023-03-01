const core = require('@actions/core');
const github = require('@actions/github');

const gh_token = core.getInput('gh_token');
const octokit = github.getOctokit(gh_token);

//console.log(`github.context: ${JSON.stringify(github.context, undefined, 2)}`);

async function get_parent_commit_by_sha(sha) {
  let commit = await octokit.rest.git.getCommit({
    ...github.context.repo,
    commit_sha: sha,
  });
  let parent_commits = commit.data.parents;
  console.log(`Commit: ${JSON.stringify(parent_commits, undefined, 2)}`);
  return commit.data.parents;
}

function get_tag_by_sha(all_tags_detailt, sha) {
  for (tag in all_tags_detailt.data) {
    if (all_tags_detailt.data[tag].object.sha == sha) {
      return all_tags_detailt.data[tag].ref.match(/^refs\/tags\/(.*)/)[1]
    }
  }
}

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
  let split_version = version.match(/(v?\d+\.\d+\.)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
}

function increment_rc(version) {
  let split_version = version.match(/(v?\d+\.\d+\.\d+-rc)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
}

function increment_r(version) {
  let split_version = version.match(/(v?\d+\.\d+\.\d+-r)(\d+)$/);
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

function main_mode(all_tags, version) {
  console.log('================================================================================');
  console.log(`DEBUG Version: ${version}`);
  if (version) {
    let max_clear_version_regex = new RegExp(`^${version.replace('.','\\.')}$`);
    let max_clear_version = get_max_tag(all_tags, max_clear_version_regex);
    console.log(`Max clear version: ${max_clear_version}`);
    let max_r_version_regex = new RegExp(`^${version.replace('.','\\.')}-r\\d+$`);
    let max_r_version = get_max_tag(all_tags, max_rc_version_regex);
    console.log(`Max rc version: ${max_rc_version}`);

  } else {
    //let max_version_regex = new RegExp(`^(v${release.replace('.','\\.')}\\.\\d+).*$`);
    //let max_version = get_max_tag_match(all_tags, max_version_regex);
    //console.log(`Max version: ${max_version}`);
    //if (max_version) {
    //  return main_mode(all_tags, max_version);
    //} else {
    //  return `v.0`;
    //}
  }
}

async function f() {
  try {
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

    const parent_commit = get_parent_commit_by_sha(sha);
    console.log(`Parent commit: ${parent_commit}`);
    console.log(`Tag by sha: ${get_tag_by_sha(all_tags_detailt, sha)}`);

    if (need_add_tag) {
      console.log('NEED to add tag');
      if (branch == 'master' || branch == 'main') {
        console.log('Rule for: master/main');
        new_tag = main_mode(all_tags, null);
      } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {
        console.log('Rule for: release/releases');
        let release = branch.match(/^releases?\/(\d+\.\d+)\.[\dx]+$/)[1];
        console.log(`Release version: ${release}`);
        new_tag = release_mode(all_tags, release, null);
      } else {
        core.setFailed(`No rule for brunch "${branch}"`);
      }
      console.log(`New tag: ${new_tag}`)
      //octokit.rest.git.createRef({
      //  ...github.context.repo,
      //  ref: `refs/tags/${new_tag}`,
      //  sha: sha
      //});
    } else {
      console.log('NO need to adding tag');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

f();