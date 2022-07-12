import { isFunction } from '../../shared/src/index'
import { effect, track, trigger } from './effect'
import { TrackOpTypes, TriggerOrType } from './operators'

class ComputedRefImpl {
  public _dirty = true // 默认取值不要缓存
  public _value
  public effect
  // ts中不写修饰符默认不会挂载到this
  constructor(getter, public setter) {
    this.effect = effect(getter, {
      lazy: true, // 默认不执行
      // trigger触发 找到effects 遍历执行 有scheduler执行scheduler
      scheduler: () => {
        // 核心 computed 依赖的属性变化后 修改dirty
        if (!this._dirty) {
          this._dirty = true
          // 通知自己收集的依赖更新
          // 计算属性 依赖的属性变化了 触发更新
          // 会找到 value 对应的那个 set[effects]  遍历执行
          trigger(this, TriggerOrType.SET, 'value')
        }
      },
    })
  }

  get value() {
    //计算属性也要收集依赖, vue2计算属性不会收集
    if (this._dirty) {
      // effect中会将返回值返回 也就是getter执行的结果
      this._value = this.effect() // 执行会将用户的返回值返回
      this._dirty = false
    }
    // 访问value的时候 把他的依赖收集起来
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  set value(newValue) {
    this.setter(newValue)
  }
}

export function computed(getterOrOptions) {
  let getter
  let setter

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {
      console.warn('computed value must be readonly')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
