const Fuse = require("fuse-native")
const path = require("path")
const fs = require("fs")

const mnt = path.resolve("./test-mounting")
const root = path.resolve("./node_modules")

// function stat(st) {
//   return {
//     mtime: st.mtime || new Date(),
//     atime: st.atime || new Date(),
//     ctime: st.ctime || new Date(),
//     size: st.size !== undefined ? st.size : 0,
//     mode: st.mode === 'dir' ? 16877 : (st.mode === 'file' ? 33188 : (st.mode === 'link' ? 41453 : st.mode)),
//     uid: st.uid !== undefined ? st.uid : process.getuid(),
//     gid: st.gid !== undefined ? st.gid : process.getgid()
//   }
// }

const fuse = new Fuse(mnt, {
  readdir: function (readPath, cb) {
    readPath = path.join(root, readPath)
    console.log(readPath)
    fs.readdir(readPath, cb)
  },
  getattr: function (readPath, cb) {
    readPath = path.join(root, readPath)
    fs.stat(readPath, (err, stats) => {
      if (err) {
        // console.error(err)
        cb(err.errno)
      } else {
        cb(null, stats)
      }
    })
  },
  open: function (readPath, flags, cb) {
    readPath = path.join(root, readPath)
    fs.open(readPath, flags, cb)
  },
  release: function (_readPath, fd, cb) {
    fs.close(fd, () => cb(0))
  },
  read: function (_readPath, fd, buf, len, pos, cb) {
    fs.read(fd, buf, pos, len, pos, cb)
  }
}, { debug: true })
fuse.mount(function (err) {
  console.error(err)
})