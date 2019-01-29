import test from 'ava';

import {preprocessArgs, parseConfigActions, parseConfig, collect, ensureArray} from './internals';

test('preprocessArgs() with empty array', t => {
    t.deepEqual(preprocessArgs(['node.exe', 'cli.js']), {
        action: null,
        args: [],
        dockerProjectArgs: ['node.exe', 'cli.js']
    });
});

test('preprocessArgs() with action only', t => {
    const actual = preprocessArgs(['node.exe', 'cli.js', 'test2']);
    const exp = {
        action: 'test2',
        args: [],
        dockerProjectArgs: ['node.exe', 'cli.js']
    };
    t.deepEqual(actual, exp);
});

test('preprocessArgs() with pre arguments only', t => {
    t.deepEqual(preprocessArgs(['node.exe', 'cli.js', '-f', 'bar', '--alice', 'bob']), {
        action: null,
        args: [],
        dockerProjectArgs: ['node.exe', 'cli.js', '-f', 'bar', '--alice', 'bob']
    });
});

test('preprocessArgs() with action and post arguments', t => {
    const actual = preprocessArgs(['node.exe', 'cli.js', 'test4', '--foo', 'bar']);
    t.deepEqual(actual, {
        action: 'test4',
        args: ['--foo', 'bar'],
        dockerProjectArgs: ['node.exe', 'cli.js']
    });
});

test('preprocessArgs() with action, pre and post arguments', t => {
    const actual = preprocessArgs(['node.exe', 'cli.js', '--apple', '-a', 'b', 'test5', '--foo', 'bar', '-b']);
    t.deepEqual(actual, {
        action: 'test5',
        args: ['--foo', 'bar', '-b'],
        dockerProjectArgs: ['node.exe', 'cli.js', '--apple', '-a', 'b']
    });
});

test('preprocessARgs() with real life case', t => {
    const actual = preprocessArgs([
        'C:\\Program Files\\nodejs\\node.exe',
        'C:\\Users\\Wolf\\AppData\\Roaming\\npm\\node_modules\\@crazyfactory\\docker-project-cli\\bin\\index.js',
        '-v',
        'up',
        '-d'
    ]);

    t.deepEqual(actual, {
        action: 'up',
        dockerProjectArgs: [
            'C:\\Program Files\\nodejs\\node.exe',
            'C:\\Users\\Wolf\\AppData\\Roaming\\npm\\node_modules\\@crazyfactory\\docker-project-cli\\bin\\index.js',
            '-v'
        ],
        args: [
            '-d'
        ]
    });
});

test('parseConfigActions()', t => {
    const actual = parseConfigActions({
        a: true,
        b: './bar',
        c: {
            command: './pie'
        }
    });

    const exp = {
        a: {},
        b: {
            command: './bar'
        },
        c: {
            command: './pie'
        }
    };

    t.deepEqual(actual, exp);
});

test('parseConfig() with empty values', t => {
    t.deepEqual(parseConfig(undefined), {});
    t.deepEqual(parseConfig(null), null);
    t.deepEqual(parseConfig({}), {});
});

test('parseConfig()', t => {
    const config = {
        command: 'alice',
        file: 'bob',
        service: 'charlie',
        actions: {
            foo: './bar'
        },
        env: {
            apple: {
                actions: {
                    a: true,
                    b: 'apple',
                    c: {},
                    d: {
                        command: 'pie'
                    }
                }
            }
        }
    };

    const expected = {
        command: 'alice',
        file: 'bob',
        service: 'charlie',
        actions: {
            foo: {
                command: './bar'
            }
        },
        env: {
            apple: {
                actions: {
                    a: {},
                    b: {
                        command: 'apple'
                    },
                    c: {},
                    d: {
                        command: 'pie'
                    }
                }
            }
        }
    };

    t.deepEqual(parseConfig(config), expected);
});

test('collect()', t => {
    const memo = [];

    t.deepEqual(collect(1, memo), [1]);
    t.deepEqual(collect('a', memo), [1, 'a']);
});

test('ensureArray()', t => {
    t.deepEqual(ensureArray(), []);
    t.deepEqual(ensureArray(''), []);
    t.deepEqual(ensureArray(null), []);
    t.deepEqual(ensureArray('a'), ['a']);
    t.deepEqual(ensureArray(0), [0]);
    t.deepEqual(ensureArray({}), [{}]);
});
