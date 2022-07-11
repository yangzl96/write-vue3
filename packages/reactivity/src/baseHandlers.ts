// 实现 new Proxy(target, handlers)
// 是不是只读的，只读没set
// 是不是深度的

import { extend } from '@vue/shared'
import { isObject } from '../../shared/src/index'
import { track } from './effect'
import { TrackOpTypes } from './operators'
import { reactive, readonly } from './reactive'

// 生成 get
const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

// 生成 set
const set = createSetter()
const shallowSet = createSetter(true)

const readonlyObj = {
  set: (target, key) => {
    console.warn(`set key ${key} on ${target} failed`)
  },
}

// get set
// 拦截获取公功能
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // proxy + Reflect
    // 后续Object上的方法会陆续被迁移到 Reflect  Reflect.getPrototypeOf
    // target[key] = value 可能会失效，但是不会报异常，也没返回标识
    // Reflect会返回true 或 false
    const res = Reflect.get(target, key, receiver) //target[key] = value

    if (!isReadonly) {
      // 收集依赖，等会数据变化后更新对应的视图
      console.log('收集依赖')
      track(target, TrackOpTypes.GET, key)
    }
    // 浅的直接返回数据
    if (shallow) {
      return res
    }
    if (isObject(res)) {
      // vue2是一上来就递归代理，vue3是当前取值时才进行代理，属于懒代理
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}
// 拦截设置功能
function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    return result
  }
}

// 声明 handlers
export const mutableHandlers = {
  get,
  set,
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
}
export const readonlyHandlers = extend(
  {
    get: readonlyGet,
  },
  readonlyObj
)
export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet,
  },
  readonlyObj
)
