import { Config } from '@jest/types'
import { readConfig } from "jest-config"
import { ScriptTransformer } from '@jest/transform'
import realpathNative from "realpath-native"
import stripBom from "strip-bom"
import yargs from "yargs"
import fs from "fs"
import path from "path"

class Runtime {
    private _scriptTransformer: ScriptTransformer
    private _extensions: string[]

    constructor(config: Config.ProjectConfig) {
        this._extensions = ["json", ...config.moduleFileExtensions].map(e => `.${e}`)
        this._scriptTransformer = new ScriptTransformer(config)
    }

    transformFile(filename: string) {
        if (!this._extensions.includes(path.extname(filename))) {
            console.log(`Unhandled extname: ${filename}`)
            return null
        }

        const text = stripBom(fs.readFileSync(filename, 'utf8'))
    
        if (path.extname(filename) === ".json") {
            return this._scriptTransformer.transformJson(
                filename,
                {} as any, // this._getFullTransformationOptions(options),
                text
            )
        } else {
            const transformedFile = this._scriptTransformer.transform(
                filename,
                {} as any, // this._getFullTransformationOptions(options),
                text // this._cacheFS[filename]
            )
            return transformedFile.code
        }
    }
}

async function createRuntime() {
    const root = realpathNative.sync(process.cwd());
    const options = await readConfig(yargs.argv, root);
    return new Runtime(options.projectConfig)
}

async function init() {
    try {
        const runtime = await createRuntime()

        console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/yarn.lock"))
        console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/package.json"))
        console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/src/lib/AppRegistry.tsx"))
    }
    catch(e) {
        console.error(e)
    }
}

init()