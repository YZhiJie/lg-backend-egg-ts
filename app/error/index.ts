export * from './user'
export * from './work'

import { userErrorMessages } from './user'
import { workErrorMessages } from './work'
import { utilsErrorMessages } from './utils'

// 错误类型：包含以下对象所有的 key 组成的联合类型
//   1. userErrorMessages
//   2. workErrorMessages
// 注：一般，每一个 controller 都有专属于自己的 ErrorMessages
export type GlobalErrorTypes = keyof (typeof userErrorMessages &
  typeof workErrorMessages &
  typeof utilsErrorMessages)

// 将所有模块的 ErrorMessages 整合为一个
export const globalErrorMessages = {
  ...userErrorMessages,
  ...workErrorMessages,
  ...utilsErrorMessages
}
