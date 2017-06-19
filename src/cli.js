#!/usr/bin/env node

const path = require('path');
const {spawn} = require('child_process');
const program = require('commander');
const chalk = require('chalk');
const deepAssign = require('deep-assign');
const updateNotifier = require('update-notifier');

const pkg = require('../package.json');
const {preprocessArgs, fileExists, parseConfig} = require('./internals');

const defaultConfig = parseConfig(require('./defaultConfig.json'));

// Notify for updates
if (pkg && pkg.version) {
    updateNotifier({pkg}).notify();
}

// Preprocess args
const {dockerProjectArgs, args, action} = preprocessArgs(process.argv);

// Define commander
program
    .version(pkg.version || 'dev')
    .option('-e, --env <name>', 'Overrides the selected environment [default: development]')
    .option('-p, --path <path>', 'Path to you projects root folder, [default: CWD]')
    .option('-s, --service <name>', 'Overrides the targeted docker service')
    .option('-f, --file <filepath>', 'Overrides the targeted docker-compose file')
    .option('-u, --user <user>', 'Run the command as this user')
    .option('-i, --index <index>', 'Index of the service is there are multiple [default: 1]')
    .option('-p, --privileged', 'Give extended privileges to the executed command process')
    .option('-v, --verbose', 'Adds additional logging')
    .option('-d, --detached', 'Detached mode: Run command in the background.')
    .parse(dockerProjectArgs);

// Set defaults
const basePath = program.path || process.cwd();
const env = program.env || process.environment || 'development';

// Try to find package json
const packageFile = path.resolve(basePath + '/package.json');
const doprFile = path.resolve(basePath + '/docker-project.json');
const packageFileExists = fileExists(packageFile);
const doprFileExists = fileExists(doprFile);
if (!packageFileExists && !doprFileExists) {
    console.error(chalk.red('neither package.json nor docker-project.json found in: ' + basePath));
    console.log(chalk.gray('Run this tool from your projects root directory or supply a --path.'));
    process.exit(1);
}

// Ensure local configuration exists
const packageConfig = packageFileExists
    ? parseConfig(require(packageFile).dopr)
    : null;
const doprConfigRaw = doprFileExists
    ? require(doprFile)
    : null;
const doprConfig = parseConfig(doprConfigRaw && (doprConfigRaw.dopr || doprConfigRaw));
if (!packageConfig && !doprConfig) {
    console.log(chalk.red('dopr is not configured.'));
    process.exit(1);
}

// Construct configuration
const mergedConfig = deepAssign({}, defaultConfig, packageConfig, doprConfig);
const environmentConfig = (mergedConfig.environments && mergedConfig.environments[env]) || {};
const config = deepAssign({}, mergedConfig, environmentConfig);

// Default action
const defaultAction = {
    file: program.file || config.file || null,
    service: program.service || config.service || null,
    command: config.command || '%action% %args%',
    user: null,
    privileged: false,
    exec: true,
    detached: false,
    index: null
};

// Final action
const cliAction = Object.assign({}, defaultAction, (config.actions && config.actions[action]) || {});
const dockerComposeFile = path.resolve(cliAction.file);

// Validation
if (!dockerComposeFile) {
    console.log(chalk.red('\'file\' not configured.'));
    process.exit(1);
}
if (!fileExists(dockerComposeFile)) {
    console.log(chalk.red('docker-compose file not found at: ' + dockerComposeFile));
    process.exit(1);
}
if (cliAction.exec && !cliAction.service) {
    console.log(chalk.red('\'service\' not configured.'));
    process.exit(1);
}

// Parse command
const cliCommand = cliAction.command
    .replace('%action%', action || '')
    .replace('%args%', args.join(' '))
    .split(' ');

// Determine docker-compose arguments
const cliUser = program.user || (cliAction.user && program.user !== null);
const cliPrivileged = program.privileged || (cliAction.privileged && program.privileged !== false);
const cliDetached = program.detached || (program.detached !== false);

// Args
const cliArgs = ['-f', dockerComposeFile]
    .concat(cliAction.exec ? ['exec', cliAction.service] : [])
    .concat(cliDetached ? ['-d'] : [])
    .concat(cliPrivileged ? ['--privileged'] : [])
    .concat(cliUser ? ['--user', cliUser] : [])
    .concat(program.index ? ['--index', program.index] : [])
    .concat(cliCommand);

if (program.verbose) {
    console.log(chalk.gray('ENV: ' + env));
    console.log(chalk.gray('ENV: ' + env));
    console.log(chalk.gray('CWD: ' + basePath));
    console.log(chalk.gray('CMD: docker-compose ' + cliArgs.join(' ')));
}

// Fire!
const childProcess = spawn('docker-compose', cliArgs, {
    cwd: basePath,
    env,
    stdio: 'inherit',
    shell: true
});

childProcess.on('close', code => {
    if (program.verbose) {
        console.log((code > 0 ? chalk.red : chalk.gray)(`command exited with code ${code}`));
    }

    // Pass through exit code
    process.exit(code);
});
