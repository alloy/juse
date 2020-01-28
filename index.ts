import { Config } from "@jest/types"
import { readConfig } from "jest-config"
import { ScriptTransformer } from "@jest/transform"
import realpathNative from "realpath-native"
import yargs from "yargs"
import Fuse from "fuse-native"
import fs from "fs"
import path from "path"

class Runtime {
    private _scriptTransformer: ScriptTransformer
    private _extensions: string[]

    constructor(config: Config.ProjectConfig) {
        this._extensions = config.moduleFileExtensions.map(e => `.${e}`)
        this._scriptTransformer = new ScriptTransformer(config)
    }

    transformFile(filename: string) {
        // TODO: Temp hack that would go away if Jest's resolver were used and whole extnames would be matched.
        if (filename.endsWith(".d.ts") || !this._extensions.includes(path.extname(filename))) {
            return null
        }
        const transformedFile = this._scriptTransformer.transform(filename, {} as any, null as any)
        return transformedFile.code
    }
}

async function createRuntime(root: string) {
    const options = await readConfig(yargs.argv, root)
    return new Runtime(options.projectConfig)
}

async function init() {
    try {
        const mnt = process.argv[2]
        if (!mnt) {
            throw new Error("Require mount point")
        }

        const root = realpathNative.sync(process.cwd())
        const runtime = await createRuntime(root)

        const fuse = new Fuse(mnt, {
            readdir(readPath, cb) {
              readPath = path.join(root, readPath)
              fs.readdir(readPath, (err, files) => cb((err && err.errno) || 0, files))
            },
            getattr(readPath, cb) {
              readPath = path.join(root, readPath)
              fs.stat(readPath, (err, stat) => {
                if (err) {
                  return cb(err.errno!)
                } else if (!stat.isDirectory()) {
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
          }, { debug: true, displayFolder: path.basename(root) })
          fuse.mount(err => {
            if (err) throw err
            console.log(`filesystem mounted on ${fuse.mnt}`)
          })
          process.once("SIGINT", function () {
            fuse.unmount(err => {
              if (err) {
                console.log(`filesystem at ${fuse.mnt} not unmounted`, err)
              } else {
                console.log(`filesystem at ${fuse.mnt} unmounted`)
              }
            })
          })
    }
    catch(e) {
        console.error(e)
    }
}

init()