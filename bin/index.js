#!/usr/bin/env node

// fallback to global only if local doesn't exist!
require('fallback-cli')('@crazyfactory/docker-project-cli/src/cli.js', '../src/cli.js');
