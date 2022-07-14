// 针对属性的操作，一系列的属性操作

import { patchAttr } from './modules/attr'
import { patchStyle } from './modules/style'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/event'

export const patchProp = (el, key, prevValue, nextValue) => {
  switch (key) {
    case 'class':
      patchClass(el, nextValue)
      break
    case 'style':
      patchStyle(el, prevValue, nextValue)
      break
    default:
      // 如果不是事件 才是属性
      if (/^on[^a-z]/.test(key)) {
        // on开头，后面不是小写字母
        // 事件就是 添加、删除、修改
        patchEvent(el, key, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }
      break
  }
}
