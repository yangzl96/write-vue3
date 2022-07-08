
import path from 'path'
import json from '@rollup/plugin-json'
import resolvePlugin from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'

// 根据环境变量中的TARGET获取对应模块的package.json
//d://xxxxx/writeVue3/packages
const packagesDir = path.resolve(__dirname, 'packages')

//d://xxxxx/writeVue3/packages/reactivity
const packageDir = path.resolve(packagesDir, process.env.TARGET)

//d://xxxxx/writeVue3/packages/reactivity/xxxx
const resolve = (p) => path.resolve(packageDir, p)

// 找到package.json
const pkg = require(resolve('package.json'))
// 取文件名 reactivity / shared
const name = path.basename(packageDir)

// 对打包类型 做映射表 根据提供的formats 来格式化需要打包的内容
// 自定义的
const outputConfig = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm.bundler.js`),
    format: 'es'
  },
  'cjs': {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'es'
  },
  'global': {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife' //立即执行函数
  }
}

// 自己设置的 buildOptions
const options = pkg.buildOptions

// 创建配置
function createConfig(format, output) {
  output.name = options.name
  output.sourcemap = true //生成sourcemap
  return {
    input: resolve('src/index.ts'),
    output,
    plugins: [
      json(),
      ts({ // ts插件
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }),
      resolvePlugin() //解析第三方模块插件
    ]
  }
}

// rollup最终需要导出配置
// 遍历设定的类型 去生成打包配置
export default options.formats.map(format => createConfig(format, outputConfig[format]))