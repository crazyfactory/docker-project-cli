const fs = require('fs');

function preprocessArgs(args) {
    let lastNeedsValue = false;
    let actionIndex = -1;
    let action = null;

    const noValueArgs = ['-v', '--verbose', '-p', '--privileged', '-d', '--detached'];

    args.forEach((str, index) => {
        if (action === null) {
            // Look for non-empty string only
            if (index >= 2) {
                const isFlag = str.substring(0, 1) === '-';
                // Found it!
                if (!isFlag && !lastNeedsValue) {
                    action = str;
                    actionIndex = index;
                }
                lastNeedsValue = isFlag && noValueArgs.indexOf(str) === -1;
            }
        }
    });

    return {
        action,
        args: action === null
            ? []
            : args.slice(actionIndex + 1),
        dockerProjectArgs: action === null
            ? args
            : args.slice(0, actionIndex)
    };
}

function fileExists(file) {
    try {
        return fs.statSync(file).size >= 0;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}

function parseConfigActions(actions) {
    const output = {};

    Object.keys(actions || {}).forEach(action => {
        const value = actions[action];

        if (value === true) {
            output[action] = {};
        }

        if (typeof value === 'string') {
            // String command
            output[action] = {
                command: value
            };
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Object command
            output[action] = value;
        }
    });

    return output;
}

function parseConfig(config = {}) {
    if (!config) {
        return config;
    }

    // Transform string-actions to proper objects
    if (config.actions && typeof config.actions === 'object') {
        config.actions = parseConfigActions(config.actions);
    }

    // Transform nested actions as well
    if (config.env) {
        Object.keys(config.env).forEach(key => {
            if (typeof config.env[key] === 'string') {
                // File shorthands are converted to objects
                config.env[key] = {
                    file: config.env[key]
                };
            } else if (typeof config.env[key].actions === 'object') {
                // Proper objects have their actions parsed
                config.env[key].actions = parseConfigActions(config.env[key].actions);
            }
        });
    }

    return config;
}

module.exports = {
    preprocessArgs,
    fileExists,
    parseConfigActions,
    parseConfig
};
