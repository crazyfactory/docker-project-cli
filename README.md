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

**Default configuration:**
```json
{
  "file": ["./docker/docker-compose.yml"],
  "service": null,
  "exec": true,
  "actions": {
    "down": {
      "comment": "Stop and destroy the docker containers",
      "command": ["%action% %args%"],
      "exec": false
    },
    "up": {
      "comment": "Bring the docker containers up and live",
      "command": ["%action% %args%"],
      "exec": false
    },
    "pull": {
      "comment": "Pull the latest versions of docker containers",
      "command": ["%action% %args%"],
      "exec": false
    },
    "start": {
      "comment": "Start the docker containers",
      "command": ["%action% %args%"],
      "exec": false
    },
    "stop": {
      "comment": "Stop the docker containers",
      "command": ["%action% %args%"],
      "exec": false
    },
    "ip": {
      "comment": "Print container IP address",
      "service": "@host",
      "command": ["docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' %args%"]
    },
    "bash": {
      "comment": "Open the interactive terminal from default service container",
      "command": ["%action% %args%"]
    },
    "composer": {
      "comment": "Run the composer command in default service container",
      "command": ["%action% %args%"]
    },
    "node": {
      "comment": "Run the node command in default service container",
      "command": ["%action% %args%"],
      "user": "node"
    },
    "npm": {
      "comment": "Run the npm command in default service container",
      "command": ["%action% %args%"],
      "user": "node"
    },
    "git": {
      "comment": "Run the git command in default service container",
      "command": ["%action% %args%"]
    },
    "yarn": {
      "comment": "Run the yarn command in default service container",
      "command": ["%action% %args%"]
    },
    "php": {
      "comment": "Run the php command in default service container",
      "command": ["%action% %args%"]
    }
  }
}
```

*Notes:*
- This will relay `up`, `down`, `start` and `stop` to `docker compose -f <file> $params$`
- This will add custom commands like `dopr bash ...`, `dopr composer ...` and `dopr optimize`
- The `node` will be launched with the user `node` by default.
- This will use a different config if NODE_ENV is set to *production* or if dopr is with `--env production`.
- The `"file"` value can be array or string.
- Use `dopr ip <container-name>` to print the IP address of container.
- To change service container for above default actions simply extend the node with override `"service"` only.

**Sample configuration with all usecases:**

```json
{
  "actions": {
    "multiple-cmd": {
      "command": ["echo multiple command as array", "@nested-cmd arg1 arg2"]
    },
    "nested-cmd": {
      "command": ["echo nested command %args%", "@deepnested-cmd --opt1 val1 --opt2 val2"]
    },
    "deepnested-cmd": {
      "command": ["echo deep nested command %args%"]
    },
    "host-cmd": {
      "service": "@host",
      "command": "docker compose version"
    },
    "composer": {
      "args": "install --prefer-dist --no-scripts",
      "command": "%action% %args%"
    }
  }
}
```

*Notes:*
- The `"actions".[$key]."command"` can be either array or string.
- The command can be reused or recalled by prefixing it with `@` (see sample above).
- The command that should run in host context will need `"service"` value of `"@host"` (see sample above).
- The action can optionally provide default arguments in `"args"` used to interpolate `%args%` when no other argument is provided (see `"composer"."args"` above).

## Usage

### docker-compose shortcuts
`dopr` will choose the correct docker-compose file for you and relay some of the most basic commands directly to docker compose.

To start you project in deamon mode run

    $ dopr up -d

You can similarly use `down` and `stop`, just like you would with `docker compose` directly.

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
