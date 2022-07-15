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
    nextSibling: hostNextSibling,
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
          // 上一次的树 老树
          const prevTree = instance.subTree
          let proxyToUse = instance.proxy
          // 新的树
          let nextTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ))
          // 比对
          patch(prevTree, nextTree, container)
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

  const mountElement = (vnode, container, anchor = null) => {
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
    // anchor 参照物 ，没有的话 就都是appendChild了，永远在最后面插入 那肯定是会出问题的
    hostInsert(el, container, anchor)
  }

  // 对比属性
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]
        // 新老不一样
        if (prev !== next) {
          hostPatchProp(el, key, prev, next)
        }
      }
      // 老的有 新的没有 删除
      for (let key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }

  const patchChildren = (n1, n2, container) => {
    const c1 = n1.children // 老儿子
    const c2 = n2.children // 新儿子

    // 老的有儿子 新的没儿子
    // 新的有儿子 老的没儿子
    // 新老都有儿子
    // 新老都是文本
  }

  const patchElement = (n1, n2, container) => {
    // 走到这个方法说明 元素是相同节点 要复用 旧的赋值给新的
    let el = (n2.el = n1.el)
    // 更新属性 更新儿子
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    // 属性比对
    patchProps(oldProps, newProps, el)
    // 儿子比对
    patchChildren(n1, n2, container)
  }

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor)
    } else {
      // 元素更新
      patchElement(n1, n2, container)
    }
  }
  // ---------------------------------处理元素结束----------------------

  // ---------------------------------文本---------------------

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // n2.children: 文本的内容
      // 创建文本 插入
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }
  // ---------------------------------处理文本结束---------------------

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }

  const unmount = (n1) => {
    hostRemove(n1.el)
  }

  const patch = (n1, n2, container, anchor = null) => {
    // 针对不同类型做初始化操作
    const { shapeFlag, type } = n2
    // 标签不一样
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 节点都不相同 把老的n1直接删掉 换成n2
      anchor = hostNextSibling(n1.el) //获取下一个节点
      unmount(n1)
      n1 = null //n1为空了，往下走 processElement 就会重新渲染n2 对应的内容
    }
    switch (type) {
      case Text:
        processText(n1, n2, container)
        return
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //元素
          console.log('处理元素')
          processElement(n1, n2, container, anchor)
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
