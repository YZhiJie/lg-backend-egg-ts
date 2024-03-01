import type { IBoot, Application } from 'egg'
// import { createConnection } from 'mongoose'
// import assert from 'node:assert'
// import { join } from 'node:path'

export default class AppBoot implements IBoot {
  private readonly app: Application
  constructor(app: Application) {
    this.app = app

    // https://www.eggjs.org/zh-CN/core/cookie-and-session#扩展存储
    // 保存数据到内存中，重启后会丢失数据
    app.sessionMap = {}
    app.sessionStore = {
      async get(key) {
        app.logger.info('key:', key)
        // 返回值
        return app.sessionMap[key]
      },
      // async set(key, value, maxAge) {
      async set(key, value) {
        app.logger.info(
          `key: ${key}, value: ${JSON.parse(JSON.stringify(value, null, 4))}`
        )
        // 设置 key 到存储
        app.sessionMap[key] = value
      },
      async destroy(key) {
        // 销毁 key
        delete app.sessionMap[key]
      }
    }

    // ! 通过插件 egg-plugin-hello 完成 db 的创建和添加（为可复用代码）
    // const { url } = this.app.config.mongoose
    // // ? 当 url 为假值时，在控制台提示参数2 message
    // assert(url, '[egg-mongoose] url is required on config')
    // const db = createConnection(url)
    // db.on('connected', () => {
    //   app.logger.info(`[egg-mongoose] ${url} connected successfully`)
    // })
    // app.mongoose = db
  }
  // constructor(private readonly app: Application) {}

  configWillLoad() {
    // ? 此时 config 文件已经被读取并合并，但还并未生效
    // 这是应用层修改配置的最后机会
    // 注意：此函数只支持同步调用
    // console.log('config', this.app.config.baseUrl)
    // coreMiddleware 为 Egg 内置的中间件
    // https://www.eggjs.org/zh-CN/basics/middleware#在框架和插件中使用中间件
    // Array.prototype.unshift(member) 头部插入 member
    // https://www.eggjs.org/zh-CN/basics/middleware#在应用中使用中间件
    // ? 下面这种配置的中间件是全局的，会处理每一次请求
    // this.app.config.coreMiddleware.unshift('myLogger')
    // console.log('enable middleware', this.app.config.coreMiddleware)
    // ! 添加 customError 中间件
    // coreMiddleware 是 egg 的内置中间件
    // 中间件的执行时机：先执行 coreMiddleware，再执行我们自己安装的或者自定义的中间件
    // ? 使用 push 添加到 egg 的内置中间件之后，表示该中间件只对我们自己安装的或者自定义的中间件
    this.app.config.coreMiddleware.push('customError')
  }

  async didLoad() {
    // 所有配置已经加载完毕
    // 可以用来加载应用自定义的文件，启动自定义服务
    // 例如：创建自定义应用的实例
    // this.app.queue = new Queue(this.app.config.queue)
    // await this.app.queue.init()
    // 例如：加载自定义目录
    // this.app.loader.loadToContext(path.join(__dirname, 'app/tasks'), 'tasks', {
    //   fieldClass: 'tasksClasses'
    // })
  }

  async willReady() {
    // 所有插件已启动完毕，但应用整体尚未 ready
    // 可进行数据初始化等操作，这些操作成功后才启动应用
    // 例如：从数据库加载数据到内存缓存
    // this.app.cacheData = await this.app.model.query(QUERY_CACHE_SQL)
    // 会比 configWillLoad 中多出一些中间件，比如 i18n 等等插件添加的中间件
    // console.log('willReady：', this.app.config.coreMiddleware)
    // const dir = join(this.app.baseDir, 'app/model')
    // https://www.eggjs.org/zh-CN/advanced/loader#loadtoapp
    // ? loadToApp 有三个参数：loadToApp(directory, property, LoaderOptions)
    // * 此函数用来将一个目录下的文件加载到 app 对象上，例如 app/model/user.js 会被加载到 app.model.user
    // directory 可以是字符串或数组。Loader 会从这些目录中加载文件。
    // property 是 app 的属性名。
    // LoaderOptions 包含了一些配置选项。
    // this.app.loader.loadToApp(dir, 'model', {
    //   // app/model/user.js => app.model.User
    //   caseStyle: 'upper'
    // })
    console.log('egg inner middleware', this.app.config.coreMiddleware)
  }

  async didReady() {
    // 应用已启动完毕
    // const ctx = await this.app.createAnonymousContext()
    // const res = await ctx.service.dog.show()
    // console.log('didReady res:', res)
    console.log('final middlewares:', this.app.middleware)
  }

  async serverDidReady() {
    // http/https 服务器已启动，开始接收外部请求
    // 此时可以从 app.server 获取 server 实例
    // this.app.server.on('timeout', (socket) => {
    //   // 处理 socket 超时
    // })
  }
}
