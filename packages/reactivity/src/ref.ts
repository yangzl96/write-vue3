import { hasChanged } from '@vue/shared'
import { track, trigger } from './effect'
import { TrackOpTypes, TriggerOrType } from './operators'
import { isObject, isArray } from '../../shared/src/index'
import { reactive } from './reactive'

export function ref(value) {
  return createRef(value)
}

// ref 内部采用 definePrototype，因为他是一个类， reactive 内部采用 proxy
// 但是好像是以前的了，现在好像都是 proxy ?

export function shallowRef(value) {
  return createRef(value, true)
}

// 处理赋值对象的时候，深度变成响应式
const convert = (val) => (isObject(val) ? reactive(val) : val)

// 核心类
class RefImpl {
  public _value
  public __v_isRef = true //产生的实例会被添加 __v_isRef 表示是一个ref属性
  constructor(public rawValue, public shallow) {
    // 初始化值
    this._value = shallow ? rawValue : convert(rawValue)
  }
  // 访问value
  get value() {
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }
  // 修改value
  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue
      // 处理新值
      this._value = this.shallow ? newValue : convert(newValue)
      trigger(this, TriggerOrType.SET, 'value', newValue)
    }
  }
}

// 创建ref
function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow)
}

// toRef
class ObjectRefImpl {
  public __v_isRef = true
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key]
  }
  set value(newValue) {
    this.target[this.key] = newValue
  }
}

// 将一个对象的某一个值 转换成 ref类型
// 其实就是将 那个属性 改成了 get 和 set
// obj = {a: 1}  const objRef = toRef(obj, 'a')
export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

// toRefs 将对象或者数组中的值 都走一遍toRef 转换
// object => 数组 或者 对象
export function toRefs(object) {
  // 创建一个容器
  const ret = isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}
