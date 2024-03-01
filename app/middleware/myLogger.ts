import type { Context, EggAppConfig } from 'egg'
import { Application } from 'egg'
import { appendFileSync } from 'node:fs'

// 注意：编写好中间件之后，需要将其添加到 config/config.default.ts 中的 config.middleware 中
// EggAppConfig['myLogger'] 表示配置对象中的 myLogger 配置项的类型
export default (options: EggAppConfig['myLogger'], app: Application) => {
  return async (ctx: Context, next: () => Promise<any>) => {
    // console.log('options:', options)
    console.log('default options:', app.config.logger)
    // true：默认两者指向同一个对象
    // console.log(options === app.config.logger ? 'true' : 'false')
    const startTime = Date.now()
    const requestTime = new Date()
    await next()
    const duration = Date.now() - startTime
    const logTime = `${requestTime} -- ${ctx.method} -- ${ctx.url} -- ${duration}ms`
    // ctx.method 为当前客户端发送的请求类型
    // 作用：在客户端发送指定类型的请求时，才记录日志
    // console.log('options.allowedMethod:', options.allowedMethod)
    if (options.allowedMethod.includes(ctx.method)) {
      // ? 打印日志的两种方式
      // * 方式一（自定义记录）
      // 注意：这里的相对路径是相对于项目根目录
      appendFileSync('./log.txt', logTime + '\n')
      // * 方式二（使用项目内置的 logger）
      // ctx.logger.info('logger excute ~')
    }
  }
}
