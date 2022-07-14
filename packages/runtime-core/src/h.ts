import { isObject, isArray } from '../../shared/src/index'
import { isVnode, createVNode } from './vnode'
export function h(type, propsOrChildren, children) {
  const l = arguments.length
  // 只有两个参数的时候
  //类型 + 属性 || 类型 + 孩子
  if (l === 2) {
    // 是对象 同时不是 数组
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 创建子节点的
      // 是否是虚拟节点： h('div', h('span'))
      // propsOrChildren是节点的
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }
      // 创建某个节点 带属性的
      // h('div', {})
      // propsOrChildren是属性的
      return createVNode(type, propsOrChildren)
    } else {
      // 如果第二个参数不是对象，那么一定是孩子
      // h('div', 'hello word')
      // propsOrChildren是数组的
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      // h('div', {}, h('p'), h('span'),.......)
      //  截取后 全都作为子节点
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVnode(children)) {
      // h('div', {}, h('p'))
      children = [children]
    }
    // propsOrChildren一定是属性描述了
    return createVNode(type, propsOrChildren, children)
  }
}
