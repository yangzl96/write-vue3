

const arr = [2, 3, 1, 5, 6, 8, 7, 9, 4]
// const arr = [1, 8, 5, 3, 4, 9, 7, 6]
// const arr = [1, 2, 0, 3, 4, 5]


// 过程
// 2
// 2 3
// 1 3
// 1 3 5
// 1 3 5 6
// 1 3 5 6 8
// 1 3 5 6 7
// 1 3 5 6 7 9
// 1 3 4 6 7 9

// 返回值是对应 arr 的索引 [2, 1, 8, 4, 6, 7] 对应值 1 3 4 6 7 9  是用贪心算法 算出的
// 但是我们要的是最长递增子序列 2 3 5 6 7 9，只能说个数是对的,反正最长就这么长

// function getSequence(arr) {
//   const len = arr.length
//   const result = [0]
//   let start, end, middle
//   for (let i = 0; i < len; i++) {
//     const arrI = arr[i]
//     debugger
//     if (arrI !== 0) {
//       // 获取结果集的最后一个索引值
//       let resultLastIndex = result[result.length - 1]
//       // 前一个跟当前值比较 
//       if (arr[resultLastIndex] < arrI) {
//         // 当前值大的话直接push
//         result.push(i)
//         continue
//       }
//       // 当前值小的话 二分查找
//       start = 0
//       end = result.length - 1
//       while (start < end) { // 重合就说明找到了
//         middle = ((start + end) / 2) | 0 //找到中间位置的前一个
//         // 当前值 大于 中间值 缩小范围
//         if (arrI > arr[result[middle]]) {
//           start = middle + 1
//         } else {
//           end = middle
//         }
//       }
//       // 找到比当前值大的数了 直接替换索引
//       if (arr[result[start]] > arrI) {
//         result[start] = i
//       }
//     }
//   }
//   return result
// }

// console.log(getSequence(arr))

// ---------------------------------------------------
// const arr = [2, 3, 1, 5, 6, 8, 7, 9, 4]

function getSequence(arr) {
  const len = arr.length
  const result = [0]
  const p = arr.slice(0) //里面内容无所谓 和原本的数组相同 用来存放索引
  let start, end, middle
  for (let i = 0; i < len; i++) {
    const arrI = arr[i]
    debugger
    if (arrI !== 0) {
      // 获取结果集的最后一个索引值
      let resultLastIndex = result[result.length - 1]
      // 前一个跟当前值比较 
      if (arr[resultLastIndex] < arrI) {
        // 当前值大的话直接push
        result.push(i)
        // 并且记住当前值的前一个值的索引
        p[i] = resultLastIndex
        continue
      }
      // 当前值小的话 二分查找
      start = 0
      end = result.length - 1
      while (start < end) { // 重合就说明找到了
        middle = ((start + end) / 2) | 0 //找到中间位置的前一个
        // 当前值 大于 中间值 缩小范围
        if (arrI > arr[result[middle]]) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      // 找到比当前值大的数了 直接替换索引
      if (arr[result[start]] > arrI) {
        if (start > 0) {
          // 大于 0 才替换 ，因为等于0的时候 前面没有值
          // 记录前一个
          p[i] = result[start - 1]
        }
        result[start] = i
      }
    }
  }
  // 根据前驱节点向前查找
  // 从后往前找
  let len1 = result.length //总长
  let last = result[len1 - 1] // 最后一个
  while (len1-- > 0) {
    result[len1] = last
    last = p[last]
  }
  return result
}

console.log(getSequence(arr))

// 求最大递增子序列

// 贪心 + 二分法

// 在查找中如果 当前的比最后一个的大 ，直接插入
// 如果当前这个比最后一个小，采用二分查找的方式，
// 找到已经排列好的列表，找到比当前数大的那一项直接替换掉

// 1 8 5 3 4 9 7 6
// 1
// 1 8
// 1 5
// 1 3 4
// 1 3 4 7
// 1 3 4 6
