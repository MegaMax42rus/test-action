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

function increment_patch(version) {
  let split_version = version.match(/v?(\d+\.\d+\.)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
}

function increment_rc(version) {
  let split_version = version.match(/v?(\d+\.\d+\.\d+-rc)(\d+)$/);
  return `${split_version[1]}${parseInt(split_version[2])+1}`;
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
      mode = 'master/main';
    } else if (branch.search(/^releases?\/\d+\.\d+\.[\dx]+$/) >= 0) {
      mode = 'release/releases';
    } else {
      core.setFailed(`No rule for brunch "${branch}"`);
    }
    console.log(`Rule for: ${mode}`);

    if (mode == 'release/releases') {
      let release = branch.match(/^releases?\/(\d+\.\d+)\.[\dx]+$/)[1];
      release = '1.2';
      console.log(`Release version: ${release}`);
      let reg1 = new RegExp(`^v${release.replace('.','\\.')}\\.\\d+-rc\\d+$`)
      let max_rc_vercion = get_max_tag(all_tags, reg1);
      if (max_rc_vercion) {
        console.log(`Max rc version: ${max_rc_vercion}`);
        let reg2 = new RegExp(`^v${release.replace('.','\\.')}\\.\\d+$`)
        let max_clear_vercion = get_max_tag(all_tags, reg2);
        if (max_clear_vercion) {
          console.log(`Max clear version: ${max_clear_vercion}`);
          if (max_rc_vercion.match(/(v\d+\.\d+\.\d+)-rc\d+$/)[1] == max_clear_vercion) {
            new_tag = `${increment_patch(max_clear_vercion)}-rc0`
            console.log('increment path +rc0')
            console.log(`New tag: ${new_tag}`)
          } else {
            new_tag = increment_rc(max_rc_vercion)
            console.log('increment rc')
            console.log(`New tag: ${new_tag}`)
          }
        } else {
          new_tag = increment_rc(max_rc_vercion)
          console.log('increment rc')
          console.log(`New tag: ${new_tag}`)
        }

      } else {
        console.log('set .0-rc0 version')
      }
    }



  } catch (error) {
    core.setFailed(error.message);
  }
}

f();