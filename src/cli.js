#!/usr/bin/env node

const path = require('path');
const {execSync, spawnSync} = require('child_process');
const program = require('commander');
const chalk = require('chalk');
const deepAssign = require('deep-assign');
const updateNotifier = require('update-notifier');

const pkg = require('../package.json');
const {preprocessArgs, fileExists, parseConfig, collect, ensureArray} = require('./internals');

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
    .option('-p, --path <path>', 'Path to your projects root folder, [default: CWD]')
    .option('-s, --service <name>', 'Overrides the targeted docker service')
    .option('-f, --file [filepath ...]', 'Overrides the targeted docker-compose file(s)', collect, [])
    .option('-u, --user <user>', 'Run the command as this user')
    .option('-i, --index <index>', 'Index of the service if there are multiple [default: 1]')
    .option('-p, --privileged', 'Give extended privileges to the executed command process')
    .option('-v, --verbose', 'Adds additional logging')
    .option('-d, --detached', 'Detached mode: Run command in the background.')
    .option('-l, --list', 'List the available actions that can be run as ' + chalk.gray('dopr <action>'))
    .parse(dockerProjectArgs);

// Set defaults
const basePath = program.path || process.cwd();
const env = program.env || process.env.NODE_ENV || 'development';

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

// Backward compat.
if (packageConfig) {
    packageConfig.file = ensureArray(packageConfig.file);
}
if (doprConfig) {
    doprConfig.file = ensureArray(doprConfig.file);
}

// Construct configuration
const mergedConfig = deepAssign({}, defaultConfig, packageConfig, doprConfig);
const environmentConfig = (mergedConfig.environments && mergedConfig.environments[env]) || {};
const config = deepAssign({}, mergedConfig, environmentConfig);

if (program.list) {
    console.log('Available actions:\n');

    Object.keys(config.actions).forEach(action => {
        const comment = config.actions[action].comment || '';

        console.log('  ' + action.padEnd(16, ' ') + chalk.gray(comment));
    });

    process.exit(0);
}

// Default action
const defaultAction = {
    file: config.file || null,
    service: config.service || null,
    command: config.command || ['%action% %args%'],
    user: config.user || null,
    privileged: config.privileged || false,
    exec: true,
    detached: false,
    index: null
};

// Program action
const programAction = {};
['detached', 'exec', 'file', 'index', 'privileged', 'service', 'user'].forEach(key => {
    const value = program[key];
    if (value !== undefined && (key !== 'file' || value.length > 0)) {
        programAction[key] = value;
    }
});

// Final action
const configAction = (config.actions && config.actions[action]) || {};
const cliAction = Object.assign({}, defaultAction, configAction, programAction);

// Validation
if (!cliAction.file || cliAction.file.length === 0) {
    console.log(chalk.red('\'file\' not configured.'));
    process.exit(1);
}

if (cliAction.exec && !cliAction.service) {
    console.log(chalk.red('\'service\' not configured.'));
    process.exit(1);
}

cliAction.file = ensureArray(cliAction.file);
cliAction.command = ensureArray(cliAction.command);

const dockerComposeFiles = [];

// Validate/sanitize all docker-compose files!
cliAction.file.forEach((file, pos) => {
    file = path.resolve(file);

    // Relative to path argument.
    if (program.path && !fileExists(file)) {
        file = path.join(program.path, cliAction.file[pos]);
    }

    if (!fileExists(file)) {
        console.log(chalk.yellow('docker-compose file not found at: ' + file));

        return;
    }

    dockerComposeFiles.push('--file', file);
});

if (dockerComposeFiles.length === 0) {
    console.log(chalk.red('at least one docker-compose file is required to exist'));

    process.exit(1);
}

const cliOptions = {
    cwd: basePath,
    stdio: 'inherit',
    shell: true
};

const exitHandler = code => {
    if (program.verbose) {
        console.log((code > 0 ? chalk.red : chalk.gray)(`command exited with code ${code}`));
    }

    // Pass through exit code
    if (code !== 0) {
        process.exit(code);
    }
};

// Default args given!
if (args.length === 0 && cliAction.args !== undefined) {
    args.push(cliAction.args);
}

// Run commands synchronously one after another!
cliAction.command.forEach(command => {
    if (program.verbose) {
        console.log(chalk.gray('ENV: ' + env));
        console.log(chalk.gray('CWD: ' + basePath));
    }

    // Is it a reference to another action?
    if (command[0] === '@') {
        const refArgs = dockerProjectArgs.slice(2).concat(command.substr(1));

        if (program.verbose) {
            console.log(chalk.gray('CMD: dopr ' + refArgs.join(' ')));
        }

        // Fire!
        return exitHandler(spawnSync('dopr ', refArgs, cliOptions).status);
    }

    // Parse command
    const cliCommand = command
        .replace(/%action%/g, action || '')
        .replace(/%args%/g, args.join(' '));

    // Command is expected to run in host context!
    if (cliAction.service === '@host') {
        return execSync(cliCommand, cliOptions);
    }

    // Args
    const user = cliAction.user ? ['--user', cliAction.user] : [];

    const cliArgs = dockerComposeFiles
        .concat(cliAction.exec ? ['exec', ...user, cliAction.service] : [])
        .concat(cliAction.detached ? ['-d'] : [])
        .concat(cliAction.privileged ? ['--privileged'] : [])
        .concat(cliAction.index ? ['--index', cliAction.index] : [])
        .concat(cliCommand);

    if (program.verbose) {
        console.log(chalk.gray('CMD: docker compose ' + cliArgs.join(' ')));
    }

    // Fire!
    exitHandler(spawnSync('docker compose', cliArgs, cliOptions).status);
});
