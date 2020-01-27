import { Config } from '@jest/types'
import { readConfig } from "jest-config"
import { ScriptTransformer } from '@jest/transform'
import realpathNative from "realpath-native"
// import stripBom from "strip-bom"
import yargs from "yargs"
import fs from "fs"
import path from "path"
import Fuse from "fuse-native"

class Runtime {
    private _scriptTransformer: ScriptTransformer
    private _extensions: string[]

    constructor(config: Config.ProjectConfig) {
        this._extensions = config.moduleFileExtensions.map(e => `.${e}`)
        this._scriptTransformer = new ScriptTransformer(config)
    }

    transformFile(filename: string) {
        // TODO: Jest's resolver wouldn’t load this, as its list of extensions includes e.g. .ios.js and thus all extensions can be matched
        if (filename.endsWith(".d.ts") || !this._extensions.includes(path.extname(filename))) {
            return null
        }

        const transformedFile = this._scriptTransformer.transform(
            filename,
            {} as any, // TODO: do we need to provide options?
            null as any // externally provided cached content
        )
        return transformedFile.code
    }
}

async function createRuntime(root: string) {
    const options = await readConfig(yargs.argv, root)
    return new Runtime(options.projectConfig)
}

async function init() {
    try {
        // console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/yarn.lock"))
        // console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/package.json"))
        // console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/src/lib/AppRegistry.tsx"))
        // console.log(runtime.transformFile("/Users/eloy/Code/Artsy/emission/src/lib/AppRegistry.tsx"))

        const mnt = process.argv[2]
        if (!mnt) {
            throw new Error("Require mount point")
        }

        const root = realpathNative.sync(process.cwd())
        const runtime = await createRuntime(root)

        const fuse = new Fuse(mnt, {
            readdir(readPath, cb) {
              readPath = path.join(root, readPath)
              // console.log(readPath)
              fs.readdir(readPath, (err, files) => cb((err && err.errno) || 0, files))
            },
            getattr(readPath, cb) {
              readPath = path.join(root, readPath)
              fs.stat(readPath, (err, stat) => {
                if (err) {
                  return cb(err.errno!)
                } else if (!stat.isDirectory()) {
                  // TODO: This should really run in parallel with fs.stat, but the default cache of
                  //       ScriptTransformer uses readSync to read the file.
                  const code = runtime.transformFile(readPath)
                  if (code) {
                    return cb(0, { ...stat, size: code.length })
                  }
                }
                return cb(0, stat)
              })
            },
            open(readPath, flags, cb) {
              readPath = path.join(root, readPath)
              const code = runtime.transformFile(readPath)
              if (code) {
                cb(0, 0)
              } else {
                fs.open(readPath, flags, (err, fd) => cb((err && err.errno) || 0, fd))
              }
            },
            release(_readPath, fd, cb) {
              if (fd === 0) {
                cb(0)
              } else {
                fs.close(fd, () => cb(0))
              }
            },
            read(readPath, fd, buf, len, pos, cb) {
              if (pos === len) {
                cb(0)
                return
              }
              if (fd === 0) {
                readPath = path.join(root, readPath)
                const data = runtime.transformFile(readPath)!.slice(pos, pos + len)
                buf.write(data)
                cb(data.length)
              } else {
                fs.read(fd, buf, 0, len, pos, (_err, bytesRead) => cb(bytesRead))
              }
            }
          }, { debug: true })
          fuse.mount(function (err) {
            console.error(err)
          })
    }
    catch(e) {
        console.error(e)
    }
}

init()