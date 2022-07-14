import { createVNode } from './vnode'

export function createAppApi(render) {
  return function createApp(rootComponent, rootProps) {
    // createApp 告诉他哪个组件哪个属性来创建应用
    // 根据组件和组件属性生成一个vnode
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      // container 挂在到哪去
      mount(container) {
        // let vnode = {}
        // render(vnode, container)
        // console.log(rendererOptions, rootComponent, rootProps, container)

        // 1.根据组件创建虚拟节点
        // 2.将虚拟节点和容器获取到后调用render方法进行渲染

        // 创建虚拟节点
        const vnode = createVNode(rootComponent, rootProps)
        // 调用render
        render(vnode, container)
        app._container = container
      },
    }
    return app
  }
}
