const core = require('@actions/core');
const github = require('@actions/github');

const gh_token = core.getInput('gh_token');
const octokit = github.getOctokit(gh_token);

//console.log(`github.context: ${JSON.stringify(github.context, undefined, 2)}`);

async function get_parent_commits_by_sha(sha) {
  let commit_detail = await octokit.rest.git.getCommit({
    ...github.context.repo,
    commit_sha: sha,
  });
  let parent_commits = [];
  for (commit in commit_detail.data.parents) {
    parent_commits.push(commit_detail.data.parents[commit].sha);
  }
  return parent_commits;
}

function get_tag_by_sha(all_tags_data, sha) {
  for (tag in all_tags_data) {
    if (all_tags_data[tag].object.sha == sha) {
      return all_tags_data[tag].ref.match(/^refs\/tags\/(.*)/)[1]
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

function get_max_tag2(tag_array_detail, regex) {
  console.log(regex);
  var max_tag;
  for (tag in tag_array_detail) {
    try {
      console.log(tag_array_detail[tag].ref);
      max_tag = tag_array_detail[tag].ref.match(regex)[0];
    } catch (error) {
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

function main_mode(all_tags_data, parent_commits, version) {
  console.log('================================================================================');
  console.log(`DEBUG Version: ${version}`);
  if (version) {
    let max_clear_version_regex = new RegExp(`^refs/tags/${version.replace('.','\\.')}$`);
    let max_clear_version = get_max_tag2(all_tags_data, max_clear_version_regex);
    console.log(`Max clear version: ${max_clear_version}`);
    let max_r_version_regex = new RegExp(`^refs/tags/${version.replace('.','\\.')}-r\\d+$`);
    let max_r_version = get_max_tag2(all_tags_data, max_r_version_regex);
    console.log(`Max r version: ${max_r_version}`);
    if (version == max_clear_version) {
      return main_mode(all_tags_data, parent_commits, increment_r(max_clear_version));
    } else {
      if (max_r_version) {
        return increment_r(max_r_version);
      } else {
        return `${version}-r2`
      }
    }
  } else {
    for (commit in parent_commits) {
      try {
        let commit_sha = parent_commits[commit];
        let commit_tag = get_tag_by_sha(all_tags_data, commit_sha);
        console.log(`Sha: ${commit_sha} Tag: ${commit_tag}`);
        if (commit_tag.search(/v?\d+\.\d+\.\d+-arc\d+$/) >= 0) {
          return main_mode(all_tags_data, parent_commits, commit_tag.match(/(v?\d+\.\d+\.\d+)-arc\d+$/)[1]);
        }
      } catch (error) {
        continue;
      }
    }
    for (commit in parent_commits) {
      try {
        let commit_sha = parent_commits[commit];
        let commit_tag = get_tag_by_sha(all_tags_data, commit_sha);
        console.log(`Sha: ${commit_sha} Tag: ${commit_tag}`);
        if (commit_tag.search(/v?\d+\.\d+\.\d+(-r\d+)?$/) >= 0) {
          return main_mode(all_tags_data, parent_commits, commit_tag.match(/(v?\d+\.\d+\.\d+)(-r\d+)?$/)[1]);
        }
      } catch (error) {
        continue;
      }
    }
    core.setFailed('No reper tags in master/main brunch');
    //return main_mode(all_tags_data, parent_commits, commit_tag.match(/(v?\d+\.\d+\.\d+)$/)[1]);
  }
}

async function f() {
  try {
    // Getting SHA and branch name
    const sha = github.context.sha;
    const branch = github.context.ref.match(/^refs\/heads\/(.*)/)[1];
    console.log(`Sha: ${sha}\nBranch: ${branch}`);

    // Getting all tags and checking if no tag
    const all_tags_detail = await octokit.rest.git.listMatchingRefs({
      ...github.context.repo,
      ref: `tags/`
    });
    const all_tags_data = all_tags_detail.data;
    var all_tags = [];
    var need_add_tag = true;
    for (tag in all_tags_data) {
      all_tags.push(all_tags_data[tag].ref.match(/^refs\/tags\/(.*)/)[1]);
      if (all_tags_data[tag].object.sha == sha) {
        need_add_tag = false;
      }
    }

    if (need_add_tag) {
      console.log('NEED to add tag');
      if (branch == 'master' || branch == 'main') {
        console.log('Rule for: master/main');
        const parent_commits = await get_parent_commits_by_sha(sha);
        new_tag = main_mode(all_tags_data, parent_commits, null);
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