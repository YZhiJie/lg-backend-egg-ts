import type { Application } from 'egg'

export default (app: Application) => {
  const { controller, router } = app

  // const logger = app.middleware.myLogger(
  //   {
  //     // 这里的配置项会被添加到中间件外层函数的第一个参数 options 中，
  //     // 使用场景：在中间件内层函数中可以通过外层函数的 options 参数获取到下面的自定义配置项，从而实现某个功能操作，比如：只有客户端发送 GET/POST 请求时，才记录日志信息
  //     allowedMethod: ['GET']
  //   },
  //   app
  // )

  // ? jsonwebtoken
  // const jwt = app.middleware.jwt({
  //   // 传递 options
  //   secret: app.config.jwt.secret
  // })

  // 有两种路由注册方式
  // 1. 通过 @HTTPController 装饰器注解
  // 2. 通过在当前文件中定义路由映射
  // router.get('/', controller.home.index)
  // router.get('/test/:id', logger, controller.test.index)
  // router.post('/test/:id', controller.test.index)
  // 添加中间件 logger
  // router.get('/dog', logger, controller.test.getDog)

  // const jwtMiddleware = app.jwt as any

  // 后端接口设计：https://sh0nh0.yuque.com/sh0nh0/xsfx0l
  // ? 接口设计遵循 RESTful API 规范
  // REST全称是 Representational State Transfer，中文意思是表述（编者注：通常译为表征）性状态转移。
  router.get('/ping', controller.home.index)
  // * 也就是每个 route url 都唯一指向一个资源，使用 method（get/post/patch/delete） 来决定要对该资源执行的操作
  // ? jwtMiddleware 验证的是用户的登录凭证 token，也就是说，带有 jwtMiddleware 中间件的路由，服务的对象是已经登录的用户
  // ? 为所有路由设置公共路径前缀，即所有 route 都是 `/api + 自己的路由`
  router.prefix('/api')
  // router.get('/users/:id', controller.user.show)
  // router.get('/users/cookie', controller.user.getTestCookie)
  // router.get('/users/session', controller.user.getTestSession)
  // user
  // 创建账户
  router.post('/users/createByEmail', controller.user.createByEmail)
  // 登录
  router.post('/users/loginByEmail', controller.user.loginByEmail)
  // 获取用户信息
  router.get('/users/getUserInfo', controller.user.show)
  // 获取验证码
  router.get('/users/genVeriCode', controller.user.sendVeriCode)
  // 使用 手机号码+验证码 登录
  router.post('/users/loginByPhoneNumber', controller.user.loginByCellphone)
  // gitee oauth
  router.get('/users/passport/gitee', controller.user.oauth)
  router.get('/users/passport/gitee/callback', controller.user.oauthByGitee)
  // work
  router.post('/works', controller.work.createWork)
  router.get('/works', controller.work.myList)
  router.get('/works/:id', controller.work.myWork)
  router.patch('/works/:id', controller.work.update)
  router.delete('/works/:id', controller.work.delete)
  router.post('/works/publish/:id', controller.work.publishWork)
  router.post('/works/publish-template/:id', controller.work.publishTemplate)
  router.get('/templates', controller.work.templateList)
  router.get('/templates/:id', controller.work.template)
  // ? channel
  router.post('/channel', controller.work.createChannel)
  // 根据 work 的 id 获取其 channels 列表
  router.get('/channel/getWorkChannels/:id', controller.work.getWorkChannel)
  router.patch('/channel/updateName/:id', controller.work.updateChannelName)
  router.delete('/channel/:id', controller.work.deleteChannel)
  // ? upload file
  // * File Mode
  // router.post('/utils/upload-img', controller.utils.fileLocalUpload)
  // * Stream Mode
  router.post('/utils/upload-img', controller.utils.fileUploadByStream)
  // router.post('/utils/upload-img', controller.utils.uploadToOSS)
  // router.post('/utils/upload-img', controller.utils.testBusboy)
  // router.post('/utils/upload-img', controller.utils.uploadMultipleFilesToOSS)
  // ? ssr：render h5 page
  router.get('/pages/:idAndUuid', controller.utils.renderH5Page)
}
