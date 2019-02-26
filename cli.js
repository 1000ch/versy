const { Observable } = require('rxjs');
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
        return new Observable(async observer => {
          const stdout = await execa.stdout('npm', ['version', version]);
          observer.next(stdout);

          const package = require(`${process.cwd()}/package`);
          task.title = `Bumping version (${package.version})`;
          observer.complete();
        });
      }
    },
    {
      title: 'Pushing updates',
      task: async (context, task) => {
        return new Observable(async observer => {
          const stdout = await execa.stdout('git', ['push']);
          observer.next(stdout);
          observer.complete();
        });
      }
    },
    {
      title: 'Pushing tags',
      task: async (context, task) => {
        return new Observable(async observer => {
          const stdout = await execa.stdout('git', ['push', '--tags']);
          observer.next(stdout);
          observer.complete();
        });
      }
    }
  ]);

  await tasks.run();
})();
