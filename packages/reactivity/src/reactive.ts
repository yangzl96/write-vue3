import { isObject } from '@vue/shared'
const mutableHandlers = {}
const shallowReactiveHandlers = {}
const readonlyHandlers = {}
const shallowReadonlyHandlers = {}
export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers)
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers)
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers)
}

// 柯里化
// new Proxy() 最核心的是需要拦截数据的读取和数据的修改 get set
const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()
export function createReactiveObject(target, isReadonly, baseHandlers) {
  // 如果目标不是对象 就没法拦截
  if (!isObject(target)) {
    return target
  }
  // 如果被代理过了 ，就不要再次代理
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const existProxy = proxyMap.get(target)
  // 被代理过了
  if (existProxy) {
    return existProxy
  }
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  
  return proxy
}
