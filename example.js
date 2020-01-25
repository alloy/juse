const Fuse = require("fuse-native")
const path = require("path")
const fs = require("fs")

const mnt = path.resolve("./test-mounting")

function stat(st) {
  return {
    mtime: st.mtime || new Date(),
    atime: st.atime || new Date(),
    ctime: st.ctime || new Date(),
    size: st.size !== undefined ? st.size : 0,
    mode: st.mode === 'dir' ? 16877 : (st.mode === 'file' ? 33188 : (st.mode === 'link' ? 41453 : st.mode)),
    uid: st.uid !== undefined ? st.uid : process.getuid(),
    gid: st.gid !== undefined ? st.gid : process.getgid()
  }
}

const ops = {
  readdir: function (path, cb) {
    if (path === '/') return cb(null, ['test'])
    return cb(Fuse.ENOENT)
  },
  getattr: function (path, cb) {
    if (path === '/') return cb(null, stat({ mode: 'dir', size: 4096 }))
    if (path === '/test') return cb(null, stat({ mode: 'file', size: 11 }))
    return cb(Fuse.ENOENT)
  },
  open: function (path, flags, cb) {
    return cb(0, 42)
  },
  release: function (path, fd, cb) {
    return cb(0)
  },
  read: function (path, fd, buf, len, pos, cb) {
    var str = 'hello world'.slice(pos, pos + len)
    if (!str) return cb(0)
    buf.write(str)
    return cb(str.length)
  }
}

const fuse = new Fuse(mnt, ops, { debug: true })
fuse.mount(function (err) {
  fs.readFile(path.join(mnt, 'test'), function (err, buf) {
    // buf should be 'hello world'
    console.log(err)
    console.log(buf)
  })
})