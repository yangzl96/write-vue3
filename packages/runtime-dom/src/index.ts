// 核心：提供domApi
// 操作节点、操作属性更新

// 节点操作就是增删改查
// 属性操作 添加 删除 更新 (样式、类、事件、其他属性)
import { createRenderer } from '@vue/runtime-core'
import { extend } from '@vue/shared'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

// vue在渲染过程中要调用的 属性操作 和 方法操作
// 渲染时用的所有方法
// 最终这些方法要传给 runtime-core
// 但是用户调用的是 runtime-dom
// runtime-dom 是为了解决浏览器api的差异
// 所以需要把这些方法传到 runtime-core
// 参数合并
const rendererOptions = extend({ patchProp }, nodeOps)

// vue中runtime-core 提供了核心的方法 用来处理渲染 他会使用runtime-dom中的api进行渲染
export function createApp(rootComponent, rootProps = null) {
  const app: any = createRenderer(rendererOptions).createApp(
    rootComponent,
    rootProps
  )
  let { mount } = app
  // 这里相当于重写mount 过程中做一些事情
  app.mount = function (container) {
    // 先清空容器
    container = nodeOps.querySelector(container)
    container.innerHTML = ''
    mount(container)
    // 将组建渲染成dom元素 进行挂载
  }
  return app
}

export * from '@vue/runtime-core'
