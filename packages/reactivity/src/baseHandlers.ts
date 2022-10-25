// 实现 new Proxy(target, handlers)
// 是不是只读的，只读没set
// 是不是深度的

import { extend } from '@vue/shared'
import {
  isObject,
  isArray,
  isIntegerKey,
  hasOwn,
  hasChanged,
} from '../../shared/src/index'
import { track, trigger } from './effect'
import { TrackOpTypes, TriggerOrType } from './operators'
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
    const oldValue = target[key] //获取老的值

    // 判断是否有key 是数组的同时key是索引的话 比对长度,大于length是新增
    // 否则 hasOwn 去检查key是否存在
    let hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)

    // 要区分是新增的 还是修改的
    if (!hadKey) {
      // 新增
      // 在 target 上 新增 一个 key 值是 value
      trigger(target, TriggerOrType.ADD, key, value)
    } else if (hasChanged(oldValue, value)) {
      // 对比值 发生变化了
      // 修改
      trigger(target, TriggerOrType.SET, key, value, oldValue)
    }

    // 数据更新的时候 通知对应属性的effect重新执行
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
