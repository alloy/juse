import Runtime from "jest-runtime"
import { Config } from '@jest/types'
import { HasteMap } from "jest-haste-map/build/types"
import { JestEnvironment } from '@jest/environment'
import { readConfig } from "jest-config"
import realpathNative from "realpath-native"
import yargs from "yargs"
import os from "os"

async function init() {
    const root = realpathNative.sync(process.cwd());
    const options = await readConfig(yargs.argv, root);

    const config: Config.ProjectConfig = options.projectConfig

    console.log(config)

    const Environment = require(config.testEnvironment);
    const environment: JestEnvironment = new Environment(config)
  
    const hasteMap: HasteMap = await Runtime.createContext(config, {
        maxWorkers: Math.max(os.cpus().length - 1, 1),
        watchman: options.globalConfig.watchman
    })

    const cacheFS = undefined // TODO: Should this be persisted?

    const resolver = Runtime.createResolver(config, hasteMap.moduleMap)
    const runtime = new Runtime(config, environment, resolver, cacheFS)
    console.log(runtime)
}

init()