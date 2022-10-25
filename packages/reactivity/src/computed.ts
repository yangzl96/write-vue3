import { isFunction } from '../../shared/src/index'
import { effect, track, trigger } from './effect'
import { TrackOpTypes, TriggerOrType } from './operators'

class ComputedRefImpl {
  public _dirty = true // 默认取值不要缓存
  public _value
  public effect
  // ts中不写修饰符默认不会挂载到this
  constructor(getter, public setter) {
    // 计算属性内部依赖的属性就会收集当前的effect函数
    // 将来依赖的属性变化后执行scheduler dirty => true
    // 那么计算属性再取值的时候 就会获取新的值
    this.effect = effect(getter, {
      lazy: true, // 默认不执行
      // trigger触发 找到effects 遍历执行 有scheduler执行scheduler
      scheduler: () => {
        // 核心 computed 依赖的属性变化后 修改dirty
        if (!this._dirty) {
          this._dirty = true

          // 让计算属性收集的 set[effects]  遍历执行
          // 这样在effect里面访问的计算属性经过重新计算 也可以拿到最新的值了
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

    // 计算属性自己也要收集effect 因为计算属性可能也要被effect使用
    // 防止依赖属性变化后 不更新值
    // 举例：如果将计算属性放在了一个effect函数里面，而不是外面console.log(myAge.value)
    // 依赖的属性age变化了，那么如果在effect里面访问了myAge.value 那么是不会执行的
    // effect(() => {
    //   console.log('effect')
    //   console.log(myAge.value) 默认情况这里的访问不到最新值，因为里面没用到age.value
    // })
    // age.value = 500
    // console.log(myAge.value) 这里的是可以访问到的最新值的

    // 因此计算属性自己也收集一个effect函数 就是包裹他的那个effect
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
