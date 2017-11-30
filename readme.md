# docker-project-cli

[![npm](https://img.shields.io/npm/v/@crazyfactory/docker-project-cli.svg)](http://www.npmjs.com/package/@crazyfactory/docker-project-cli)
[![Build Status](https://travis-ci.org/crazyfactory/docker-project-cli.svg?branch=master)](https://travis-ci.org/crazyfactory/docker-project-cli)
[![dependencies Status](https://david-dm.org/crazyfactory/docker-project-cli/status.svg)](https://david-dm.org/crazyfactory/docker-project-cli)
[![devDependencies Status](https://david-dm.org/crazyfactory/docker-project-cli/dev-status.svg)](https://david-dm.org/crazyfactory/docker-project-cli?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/crazyfactory/docker-project-cli.svg)](https://greenkeeper.io/)

A simple CLI tool simplify docker based project administration. Not meant to replace anything, just reducing your CLI overhead.

## Installation

Install it globally for quick access

    $ npm i -g @crazyfactory/docker-project-cli

Optionally install it locally, to pin down versions if required.

    $ npm i --save @crazyfactory/docker-project-cli


## Configuration
 
Configuration of DOPR can be done either via `package.json` under the `dopr` key or with a provided file defaulting to `docker-project.json`.

Default configuration
```json
{
  "file": ["./docker/docker-compose.yml"],
  "service": null,
  "exec": true,
  "actions": {
    "down": {
      "command": "%action% %args%",
      "exec": false
    },
    "up": {
      "command": "%action% %args%",
      "exec": false
    },
    "start": {
      "command": "%action% %args%",
      "exec": false
    },
    "stop": {
      "command": "%action% %args%",
      "exec": false
    },
    "bash": "%action% %args%",
    "composer": "composer %action% %args%",
    "node": {
      "command": "node %action% %args%",
      "user": "node"
    },
    "npm": "npm %action% %args%",
    "git": "git %action% %args%",
    "yarn": "yarn %action% %args%",
    "multiple-cmd": {
      "command": ["echo multiple command as array", "@nested-cmd arg1 arg2"]
    },
    "nested-cmd": {
      "command": ["echo nested command %args%", "@deepnested-cmd --opt1 val1 --opt2 val2"]
    },
    "deepnested-cmd": {
      "command": ["echo deep nested command %args%"]
    }
  }
}
```

Notes:
- This will relay `up`, `down`, `start` and `stop` to `docker-compose -f <file> $params$`
- This will add custom commands like `dopr bash ...`, `dopr composer ...` and `dopr optimize`
- The `node` will be launched with the user `node` by default.
- This will use a different config if NODE_ENV is set to *production* or if dopr is with `--env production`.
- The `"file"` value can be array or string.
- The `"actions"[\d]."command"` can be either array or string.
- The command can be reused or recalled by prefixing it with `@` (see sample above).

## Usage

### docker-compose shortcuts
`dopr` will choose the correct docker-compose file for you and relay some of the most basic commands directly to docker-compose.

To start you project in deamon mode run

    $ dopr up -d

You can similarly use `down` and `stop`, just like you would with `docker-compose` directly.

### custom commands

You can add simple custom commands, but we add some by default. They are passed through to the service specified in your dopr configuration.

For instance to open a bash session just run

    $ dopr bash

You can similarly access `node`, `npm`, `git` and `composer` like so

    $ dopr npm run my-script

or so

    $ dopr composer dump-autoload -o

Using the configuration you can add your own commands. If you want to use `yarn` for instance, simply add it
```json
{
  "action": [
    "yarn"
  ]
}
```

You can also specify a different service if required. So you can add shortcuts for other docker instances like mysql as well.
```json
{
  "action": [
    {
      "key": "mysql",
      "service": "mysql-service"
    }
  ]
}
```

## License

Copyright (c) 2017 Crazy Factory Trading Co. Ltd.

Licensed under the MIT license.

See LICENSE for more info.
