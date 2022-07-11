// 只针对具体某个包打包


// 把packages下的所有包打包

const fs = require('fs')
const execa = require('execa') //开启子进程

const targets = fs.readdirSync('packages').filter(f => {
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false
  } else {
    return true
  }
})


async function build(target) {
  // 执行rollup命令 并传参
  await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
    stdio: 'inherit' //子进程打包的信息共享给父进程
  })
}

// 开发模式：单独打包某一个模块 并监听 -cw
build('reactivity')