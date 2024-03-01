import { GlobalErrorTypes } from '@/error'
import { Controller } from 'egg'

// ? 创建工厂函数，传入 rules 和 errorType
// 作用: 使用传入的 rules 验证客户端发送的 body 数据源, 如果验证不通过, 则返回错误类型为 errorType 的响应消息
export default function validateInput(rules: any, errorType: GlobalErrorTypes) {
  // 下划线开头的参数是没有使用到的
  // ? 以下划线开头可以避免参数没有被使用的警告
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 被装饰方法的函数体
    const originalMethod = descriptor.value
    // 给被装饰方法重新赋予一个新的函数体(扩展额外的功能)
    descriptor.value = function (...args: any[]) {
      // 这里的 this 就是 Controller 中的方法中的 this 指向
      const that = this as Controller
      // ? Property 'app' is protected
      // app 字段只能在类中使用或者该类的子类中使用, 不能在一个函数中使用
      // 当前函数是一个装饰器函数, 装饰器函数是在类中被执行的, 所以是可以使用的
      // 但是由于 TS 不了解这个特性, 所以目前需要我们手动消除该错误
      // ! 注意: 如果要忽略 ts 语法检查, 必须要非常确定该规则可以被忽略
      // @ts-expect-error Property 'app' is protected
      const { ctx, app } = that
      // * 1. 使用 egg-validate 校验参数
      // https://github.com/node-modules/parameter#rule
      const errors = app.validator.validate(rules, ctx.request.body)
      if (errors) {
        return ctx.helper.error({ ctx, errorType, error: errors })
      }
      // * 2. 调用原来的函数体
      return originalMethod.apply(this, args)
    }
  }
}
