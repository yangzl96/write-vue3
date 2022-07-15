import { effect } from '@vue/reactivity'
import { ShapeFlags } from '@vue/shared'
import {
  createComponentInstance,
  setupComponent,
} from 'packages/runtime-dom/src/component'
import { createAppApi } from './apiCreateApp'
import { queueJob } from './schedule'
import { normalizeVNode, Text } from './vnode'
// 创建渲染器
// rendererOptions: 告诉core怎么渲染
export function createRenderer(rendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = rendererOptions

  // ----------------------------- 组件 ----------------------
  const setupRenderEffect = (instance, container) => {
    // 需要创建effect 在effect中调用render 这样render中访问的数据会收集这个effect
    // 属性更新 effect 重新执行

    // 每个组件都有一个effect vue3是组件级别更新
    // 数据变化会重新执行对应组件的effect
    instance.update = effect(
      function componentEffect() {
        if (!instance.isMounted) {
          // 初次渲染
          let proxyToUse = instance.proxy
          // 渲染完组件后，拿到组件render函数的返回值
          // subTree: vnode
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ))

          // 初始化 子树
          patch(null, subTree, container)
          instance.isMounted = true
        } else {
          // 更新逻辑
          console.log('更新了')
        }
      },
      {
        scheduler: queueJob,
      }
    )
  }
  const mountComponent = (initalVNode, container) => {
    // 组件的挂载 => 实现组件的渲染流程
    // 核心：调用 setup 拿到返回值，获取render函数的返回的结果来进行渲染
    // 1.先有实例
    // 创建一个实例 挂载到虚拟节点的component上
    const instance = (initalVNode.component =
      createComponentInstance(initalVNode))
    // 2.需要的数据解析到实例上(给实例赋值)
    setupComponent(instance)
    // 3.创建一个effect 让render函数执行
    setupRenderEffect(instance, container)
  }
  // n1:old n2:new
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      // 组件没有上一次的虚拟节点 初始化的时候
      // 将n2挂载
      mountComponent(n2, container)
    } else {
      // 组件更新
    }
  }
  // ----------------------------- 处理组件结束 ----------------------

  // ----------------------元素--------------------------

  // 挂载子节点
  const mountChildren = (children, container) => {
    // 循环插入
    for (let i = 0; i < children.length; i++) {
      // child变成 vnode 了
      let child = normalizeVNode(children[i])
      // 把child变成真实节点 再插入
      patch(null, child, container)
    }
  }
  const mountElement = (vnode, container) => {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode
    let el = (vnode.el = hostCreateElement(type))

    // 属性
    if (props) {
      for (const key in props) {
        console.log(props[key])
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 渲染儿子
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 数组
      mountChildren(children, el)
    }
    // 插入元素
    hostInsert(el, container)
  }
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      // 元素更新
    }
  }
  // ---------------------------------处理元素结束----------------------

  // ---------------------------------文本---------------------

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // n2.children: 文本的内容
      // 创建文本 插入
      console.log(n2)
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }
  // ---------------------------------处理文本结束---------------------

  const patch = (n1, n2, container) => {
    // 针对不同类型做初始化操作
    const { shapeFlag, type } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container)
        return
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //元素
          console.log('处理元素')
          processElement(n1, n2, container)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //组件
          console.log('处理组件')
          processComponent(n1, n2, container)
        }
        break
    }
  }

  const render = (vnode, container) => {
    // core的核心，根据不同的虚拟节点，创建对应的真实元素
    // 默认调用render 肯定是初始化流程
    patch(null, vnode, container)
  }
  return {
    createApp: createAppApi(render),
  }
}
