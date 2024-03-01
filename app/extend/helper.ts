import { GlobalErrorTypes, globalErrorMessages } from '@/error'
import type { Context } from 'egg'

/** 类型声明：给客户端响应的数据类型 */
// 1. 操作执行成功时
interface RespType {
  ctx: Context
  res?: any
  msg?: string
}
// 2. 操作执行失败时
interface ErrorRespType {
  ctx: Context
  errorType: GlobalErrorTypes
  // 自定义错误
  error?: any
}

export default {
  // 请求成功时，返回响应数据
  success({ ctx, res, msg }: RespType) {
    // http 响应体
    ctx.body = {
      // 没有出错时，返回 0
      errno: 0,
      data: res ? res : null,
      message: msg ? msg : '请求成功'
    }
    // http 响应状态
    ctx.status = 200
  },
  // 请求出错时，返回报错信息
  error({ ctx, errorType, error }: ErrorRespType) {
    const { message, errno } = globalErrorMessages[errorType]
    // http 响应体
    ctx.body = {
      errno,
      message,
      // 存在则添加
      ...(error && { error })
    }
    // http 响应状态
    ctx.status = 200
  }
}
