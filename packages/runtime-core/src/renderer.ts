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

  // 比较两个带key的数组
  // c1: 老的儿子列表
  // c2: 新的儿子列表
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0 // 默认从头开始对比
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    // Vue3 对特殊情况进行优化
    // 一直在确定一个范围
    // 从到到尾一个个比较
    // 有一个循环完 或者遇到不同的 就停止
    // 尽可能的减少比对的区域
    // 缩小前面的范围
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        // 如果是同一个节点，比属性，再比较儿子
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }

    // 上面的策略比对完了就走这个策略
    // 从尾到头比
    // 缩小后面的范围
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        // 如果是同一个节点，比属性，再比较儿子
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }

    // 例如：
    // a b c d
    // a b e f c d
    // 前后对比完后 剩下的就是 f c

    // 如何确定是要挂载？

    // 如果完成后 最终 i > e1 说明i已经超过了 e1，那么就要新增了
    if (i > e1) {
      //老的少 新的多 前提：有一方已经比对完成了 要新增
      if (i <= e2) {
        // 想知道是向前插入 还是向后插入 找参照物
        // 参照物：找当前元素( e2)的下一个， 有元素的话就是向前插入 没元素的话就是向后插入
        const nextPos = e2 + 1
        // nextPos < c2.length : 向前插入
        //         a b :n1
        // d e f e a b :n2
        // 向后插入：
        // a b :n1
        // a b c d e f :n2
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        // 确定新增的部分
        while (i <= e2) {
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 老的多 新的少 前提：有一方已经比对完成了
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      // 到这里了 经过前面的从头到尾 从尾到头 ，已经确定了中间的乱序的范围
      // 乱序比较，需要尽可能的复用 用新的元素做成映射表 去老的里面找
      // 一样的就复用，不一样的要么插入，要么删除

      let s1 = i
      let s2 = i

      // vue3用的是新的 做映射表，Vue2是用老的
      const keyToNewIndexMap = new Map()
      // 生成映射表 key => index
      for (let i = s2; i <= e2; i++) {
        const childVNode = c2[i] //新的
        keyToNewIndexMap.set(childVNode.key, i)
      }

      // 确定要被patch的个数
      const toBePatched = e2 - s1 + 1 //因为都是索引 所以 + 1
      // 新的索引和老的索引做映射 默认4个0
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

      // 去老的里面查找，有没有复用的
      for (let i = s1; i <= e1; i++) {
        // 取出老的
        const oldVnode = c1[i]
        // 去新的里面找对应老的 获取到新的里面的索引
        let newIndex = keyToNewIndexMap.get(oldVnode.key)
        if (newIndex === undefined) {
          // 老的里的元素不在新的里面
          unmount(oldVnode)
        } else {
          // 新和老的 索引关系
          // newIndex - s2 : 为了确保是在那个处理好的范围内
          // i + 1: 为了处理出现 0 的情况，就和原有的数组 0 一样了，不好区分
          // 这样没有被处理过的 值就是 0
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // 新老比对 做了复用
          // 找到了对应的元素 再去做比对
          patch(oldVnode, c2[newIndex], el)
        }
      }

      // 移动
      // 遍历那个处理好的范围，倒序插入，先插入最后一个，可以拿到参照物
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 找到当前的索引 要在新的里面找 就要加上s2 确保索引，因为toBePatched就只是那个处理好的范围
        let currentIndex = i + s2
        let child = c2[currentIndex]
        // 找到参照物 下一项有值 就说明是insertBefore 没有值就是appendChild
        let anchor =
          currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null

        if (newIndexToOldIndexMap[i] == 0) {
          // 没有被Patch过
          // 新增 通过patch去创建虚拟节点，同时插入后会拥有真实节点
          patch(null, child, el, anchor)
        } else {
          // 前面已经patch过的元素 再依次以以前一个为anchor 再插入
          // 直接调用 hostInsert(child.el, el, anchor)
          // 但是 是不是每个元素都重新操作了一遍？ 所有的都移动了
          // 希望尽可能的少移动
          // 看 newIndexToOldIndexMap ：[5,3,4,0] 这个不是新老索引的关系吗？
          // 找到 最长的递增子序列 3 4 说明这两个不需要动，只需要动不连续的
          // [1,2,3,4,5,6]
          // [1,6,2,3,4,5]
          // 是不是只需要动 6 其他的不用动
          hostInsert(child.el, el, anchor)
        }
      }

      // 最后就是移动节点，并且将新增的节点插入
      // 最长递增子序列
    }
  }

  // 批量删除儿子
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  // 儿子比对
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children // 老儿子
    const c2 = n2.children // 新儿子

    // 老的有儿子 新的没儿子
    // 新的有儿子 老的没儿子
    // 新老都有儿子
    // 新老都是文本

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag
    // 当前是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //case1:现在是文本 之前是数组
      // 老的是n个孩子 但是新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1) //如果包含组件会调用组件的卸载
      }
      // 两个都是文本
      if (c2 !== c1) {
        //case2:现在之前都是文本
        hostSetElementText(el, c2)
      }
    } else {
      // 当前不是文本
      // 上一次有可能是文本 或者 数组
      // h('div',  [h('span', 'hello'), h('span', 'hello')])
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //case3:现在之前都是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前也是数组，比对两个数组
          // 核心
          patchKeyedChildren(c1, c2, el)
        } else {
          // 上一次是数组 这次不是文本 ，也不是数组
          // 那就是 没有儿子，删掉老的
          unmountChildren(c1)
        }
      } else {
        // 当前不是文本
        // 上一次不是数组
        // 那么上一次可能是文本 清空
        //case4:现在是数组都是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 如果当前是数组 全部挂在
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
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
    patchChildren(n1, n2, el)
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
