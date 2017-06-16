# docker-project-cli

[![npm](https://img.shields.io/npm/v/@crazyfactory/docker-project-cli.svg)](http://www.npmjs.com/package/@crazyfactory/webp-converter-cli)
[![Build Status](https://travis-ci.org/crazyfactory/docker-project-cli.svg?branch=master)](https://travis-ci.org/crazyfactory/webp-converter-cli)
[![dependencies Status](https://david-dm.org/crazyfactory/docker-project-cli/status.svg)](https://david-dm.org/crazyfactory/webp-converter-cli)
[![devDependencies Status](https://david-dm.org/crazyfactory/docker-project-cli/dev-status.svg)](https://david-dm.org/crazyfactory/tinka?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Greenkeeper badge](https://badges.greenkeeper.io/crazyfactory/docker-project-cli.svg)](https://greenkeeper.io/)

A simple CLI tool simplify docker based project administration. Not meant to replace anything, just reducing your CLI overhead.

## Installation

Install it globally for quick access

    $ npm i -g @crazyfactory/docker-project-cli

Optionally install it locally, to pin down versions if required.

    $ npm i --save @crazyfactory/docker-project-cli 


## Configuration
 
Configuration of DOPR can be done either via `package.json` under the `dopr` key or with a provided file defaulting to `.dopr.json`.

Default configuration
```json
{
  "file": "./docker/docker-compose.yml", // the docker compose yml file to be used
  "service": "php-fpm", // the default service for all commands, can be overwritten for each command
  "command": "php ./src/cli.php %params%", // the default command if no match is found
  "actions": {
    "bash": {},
    "composer": {}, 
    "npm": {}, 
    "git": {}, 
    "yarn": {}
  },
  "environments": {
    "staging": "./docker/docker-compose.staging.yml",
    "production": {
      "file": "./docker/docker-compose.prod.yml" // use a different configuration file
    }
  }
}
```

Notes:
- This will relay `up`, `down` and `stop` to `docker-compose -f <file> $params$`
- This will add 3 custom commands for `dopr bash ...`, `dopr composer ...` and `dopr optimize`
- This will use a different config if DOPR_ENV is set to *production* or if the first argument matches.

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
  "commands": [
    "yarn"
  ]
}
```

You can also specify a different service if required. So you can add shortcuts for other docker instances like mysql as well.
```json
{
  "commands": [
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
