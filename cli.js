const package = require('./package');
const minimist = require('minimist');
const execa = require('execa');
const Listr = require('listr');
const inquirer = require('inquirer');

const argv = minimist(process.argv.slice(2), {
  alias: {
    v: 'version'
  }
});

if (argv.v || argv.version) {
  console.log(package.version);
  return;
}

const versions = ['major', 'minor', 'patch'];

(async () => {
  const arg = argv._[0];
  const { version } = versions.includes(arg) ? arg : await inquirer.prompt([{
    type: 'list',
    name: 'version',
    choices: versions
  }]);

  const tasks = new Listr([
    {
      title: 'Bumping version',
      task: async () => {
        await execa('npm', ['version', version])
      }
    },
    {
      title: 'Pushing update',
      task: async () => {
        await execa('git', ['push']);
      }
    },
    {
      title: 'Pushing tags',
      task: async () => {
        await execa('git', ['push', '--tags']);
      }
    }
  ]);

  await tasks.run();
})();
