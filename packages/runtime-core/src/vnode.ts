import { isObject, isString, ShapeFlags, isArray } from '../../shared/src/index'

export function isVnode(vnode) {
  return vnode.__v_isVnode
}

// 创建虚拟节点
export const createVNode = (type, props, children = null) => {
  // type 区分是组件 还是 普通的元素

  // 给虚拟节点加一个类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  // 一个对象来描述对应内容， 虚拟节点有跨平台的能力
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    component: null, //存放组件对应的实例
    el: null, // 稍后会将虚拟节点和真实节点对应起来
    key: props && props.key,
    shapeFlag, //判断出当前自己的类型和儿子的类型
  }
  normalizeChildren(vnode, children)
  return vnode
}

function normalizeChildren(vnode, children) {
  let type = 0
  if (children === null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.shapeFlag = vnode.shapeFlag | type
}

export const Text = Symbol('Text')
export function normalizeVNode(child) {
  // 是对象 说明是h方法
  if (isObject(child)) return child
  // 创建文本节点
  return createVNode(Text, null, String(child))
}
