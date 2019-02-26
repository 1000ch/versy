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
  console.log(require('./package').version);
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
      task: async (context, task) => {
        task.output = await execa.stdout('npm', ['version', version]);
        const package = require(`${process.cwd()}/package`);
        task.title = `Bumping version (${package.version})`;
      }
    },
    {
      title: 'Pushing updates',
      task: async (context, task) => {
        task.output = await execa.stdout('git', ['push']);
      }
    },
    {
      title: 'Pushing tags',
      task: async (context, task) => {
        task.output = await execa.stdout('git', ['push', '--tags']);
      }
    }
  ]);

  await tasks.run();
})();
