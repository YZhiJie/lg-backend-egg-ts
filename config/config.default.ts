// import path from 'node:path'
import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg'
// ? 导入 commonjs 规范的模块
import * as dotenv from 'dotenv'
import { join } from 'node:path'

// https://github.com/motdotla/dotenv?tab=readme-ov-file#config
// config will read your .env file, parse the contents, assign it to process.env
// 调用 config 方法之后，就可以通过 process.env.xxx 读取 .env 中配置的键值对了
dotenv.config()

// https://www.eggjs.org/zh-CN/basics/config#配置写法
// https://www.eggjs.org/zh-CN/basics/plugin#插件列表
export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  // ? appInfo.name 就是 package.json 中的 name 字段值
  config.keys = appInfo.name + '_1705988360494_8757'

  // add your egg config in here
  // 添加自定义的中间件，与中间件文件名称保持一致
  // config.middleware = ['myLogger']
  // https://www.eggjs.org/zh-CN/basics/middleware#在应用中使用中间件
  // ? 下面这种方式配置的中间件是全局的，会处理每一次请求
  // 配置需要的中间件，数组顺序即为中间件的加载顺序
  // 调用时机：应该是先调用 egg 内置的中间件和下面的中间件，最后再调用路由请求中配置的处理中间件
  // ? 可以在 app.ts 中的 didReady 生命周期中打印 this.app.middleware 获取最终的中间件数组，数组元素的顺序就是中间件的执行顺序
  // ! 下面一句设置的弊端：无法准确设置中间件的执行顺序
  // 例如： egg-jwt 中间件在 customError 中间件执行，所以 customError 中间件无法捕获 egg-jwt 抛出的异常
  // ! 可以在 app.ts 中的 configWillLoad 生命周期中手动添加中间件
  // config.middleware = ['customError']

  // 安全配置
  config.security = {
    // 非最佳解决方式（后续会进一步深入学习   ）
    // 关闭默认开启的 POST 请求时的 CSRF Token 验证
    // 作用：客户端可以发送 POST 请求
    csrf: {
      enable: false
    },
    // 域名白名单：跨域时允许请求的域名
    domainWhiteList: ['http://localhost:8080']
  }
  // 日志配置
  // 日志分为 NONE，DEBUG，INFO，WARN 和 ERROR 5 个级别
  // 日志打印到文件中的同时，为了方便开发，也会同时打印到终端中
  // https://www.eggjs.org/zh-CN/core/logger#终端日志级别
  config.logger = {
    // 配置 logger 文件的目录，logger 默认配置由框架提供
    // dir: path.join(appInfo.baseDir, 'logs'),
    // ! 设置打印日志的最低级别（大于该级别的都会被打印）
    // 文件日志级别
    // level: 'DEBUG'
    // 终端日志级别
    consoleLevel: 'DEBUG'
  }

  // 添加 mongoose 配置信息
  config.mongoose = {
    // ? 连接数据库：lego-backend
    // 需要在 mongoDB 中创建一个数据库：lego-backend
    url: 'mongodb://localhost:27017/lego-backend',
    options: {
      // 连接数据库的帐号（管理 lego-backend 的帐号）
      // user: 'zhangsan',
      user: 'root',
      pass: '123456',
      // 设置认证帐号的来源（默认使用的是当前连接的数据库中的用户）
      // 上面的 root 是来源于 admin 数据库的系统级别的账户
      authSource: 'admin'
    }
  }

  // egg-bcrypt
  config.bcrypt = {
    // 默认值
    saltRounds: 10
  }

  // egg-session 的配置
  // https://www.eggjs.org/zh-CN/core/cookie-and-session#session-实践
  config.session = {
    // 和 cookie 是一样的配置
    encrypt: false
  }

  // ? 插件配置(直接通过 config.xxx 进行配置)
  // egg-jwt
  config.jwt = {
    enable: true,
    secret: process.env.JWT_SECRET || '',
    // https://www.eggjs.org/zh-CN/basics/middleware#match-和-ignore
    // 匹配上的路由才会应用当前中间件, match 是只要有部分匹配上就行
    // 这里就是, 只有匹配上的路由才进行 jwt 验证, 即需要登陆后才可以访问的路由
    // ? 可以完全匹配, 也可以匹配上开头一部分, 比如 /api/works 表示匹配所有以 /api/works 开头的路由
    match: [
      '/api/users/getUserInfo',
      '/api/works',
      '/api/utils/upload-img',
      '/api/channel'
    ]
  }
  // egg-redis
  // https://www.npmjs.com/package/egg-redis
  config.redis = {
    // Single Client
    client: {
      port: 6379,
      host: '127.0.0.1',
      // 连接认证密码
      password: 'redispass',
      // 数据库实例序号
      db: 0
    }
  }

  // 阿里云短信业务配置
  // https://ram.console.aliyun.com/manage/ak?spm=5176.12818093_47.top-nav.dak.5adc16d0XhthYn
  const aliCloudConfig = {
    // 必填，您的 AccessKey ID
    accessKeyId: process.env.ALI_ACCCESS_KEY,
    // 必填，您的 AccessKey Secret
    accessKeySecret: process.env.ALI_ACCCESS_KEY_SECRET,
    // Endpoint 请参考 https://api.aliyun.com/product/Dysmsapi
    endpoint: 'dysmsapi.aliyuncs.com'
  }
  // ? https://www.npmjs.com/package/egg-oss#configration
  // * 创建 AccessKey：https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair?spm=a2c4g.53045.0.i3#task-2245479
  // RAM 访问控制 (aliyun.com)：https://ram.console.aliyun.com/manage/ak?spm=5176.12818093_47.top-nav.dak.5adc16d0XhthYn
  config.oss = {
    // normal oss bucket
    client: {
      // 访问 id 和密钥
      accessKeyId: process.env.ALI_ACCCESS_KEY || '',
      accessKeySecret: process.env.ALI_ACCCESS_KEY_SECRET || '',
      // 阿里云 OSS 存储桶名称
      bucket: 'lego-backend',
      // https://help.aliyun.com/zh/oss/user-guide/regions-and-endpoints
      // 在存储桶详情页面 > **概览** > **访问端口** > **外网访问** 行中的 >  Endpoint（地域节点）
      // 注：不同地域的域名也会不一样，下面是上海的 EndPoint
      endpoint: 'oss-cn-shanghai.aliyuncs.com'
    }
  }

  // ? gitee oauth config
  // https://gitee.com/oauth/applications/39575
  // 以下配置信息从创建的 gitee 第三方应用中获取
  const giteeOauthConfig = {
    cid: process.env.GITEE_CID,
    secret: process.env.GITEE_SECRET,
    redirectURL: 'http://localhost:7001/api/users/passport/gitee/callback',
    authURL: 'https://gitee.com/oauth/token?grant_type=authorization_code',
    giteeUserApi: 'https://gitee.com/api/v5/user'
  }

  // egg view 模板渲染
  // https://www.eggjs.org/zh-CN/core/view#mapping-%E5%92%8C-defaultviewengine
  config.view = {
    defaultViewEngine: 'nunjucks'
  }

  // egg-cors 支持跨域
  // https://www.npmjs.com/package/egg-cors#configuration
  // https://github.com/koajs/cors?tab=readme-ov-file#corsoptions
  // ? 由于下面的配置和 config.security.domainWhiteList 的作用一样，所以注释下面的配置
  // config.cors = {
  //   // 允许请求的站点（客户端）
  //   origin: 'http://localhost:8080',
  //   // 允许的请求方法
  //   allowMethods: 'GET,HEAD,PUT,OPTIONS,POST,DELETE,PATCH'
  // }

  // ? Stream 模式具备更灵活的操作，所以本次项目开发使用 Stream 模式
  // mode 配置项默认为 'stream'
  config.multipart = {
    // After file mode enable, egg will remove the old temporary files(don't include today's files) on 04:30 AM every day by default.
    // 启用 File 模式，上传文件时，会将该文件以临时文件的方式保存到一个具体的目录下，可以通过 tmpdir 修改临时文件的存放路径，egg 会在每天凌晨 4:30 自动清除前一天生成的所有临时文件
    // https://www.eggjs.org/zh-CN/basics/controller#file-模式
    // mode: 'file',
    // 保存临时文件到当前项目根目录下的 uploads 文件夹中
    // tmpdir: join(appInfo.baseDir, 'uploads')
    // https://github.com/eggjs/egg-multipart?tab=readme-ov-file#egg-multipart
    // ? 设置允许上传的文件扩展名
    whitelist: ['.png', '.jpg', '.gif', '.webp'],
    // ? 限制上传的文件大小
    fileSize: '30kb'
  }

  // https://www.eggjs.org/zh-CN/intro/quickstart#静态资源
  // https://github.com/eggjs/egg-static?tab=readme-ov-file#configuration
  config.static = {
    // 静态资源路径映射配置
    dir: [
      // 就是当访问以 prefix 为前缀的 url 时，实际会映射到 dir 设置的路径
      // 所以，当访问 http://localhost:7001/public/xxx.jpg 时，实际访问的是：项目根目录下的 app/public/xxx.jpg
      { prefix: '/public', dir: join(appInfo.baseDir, 'app/public') },
      { prefix: '/uploads', dir: join(appInfo.baseDir, 'uploads') }
    ]
  }

  // ? 业务逻辑配置
  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    // 下面的配置项会被添加到中间件外层函数的第一个参数 options 中，
    // 使用场景：在中间件内层函数中可以通过外层函数的 options 参数获取到下面的自定义配置项，从而实现某个功能操作，比如：只有客户端发送 POST 请求时，才记录日志信息
    // 对自定义中间件 myLogger 进行单独配置
    myLogger: {
      // 只有客户端发送 POST 时，才会记录日志
      allowedMethod: ['POST']
    },
    baseUrl: 'default.url',
    aliCloudConfig,
    giteeOauthConfig,
    // 开发环境
    H5BaseURL: 'http://localhost:7001/api/pages',
    // 开发环境下，jwt token 的过期时间为 1 hour
    jwtExpires: '1h'

    // jsonwebtoken 验证配置信息
    // jwt: {
    //   secret: '1234567890'
    // }
    // mongoose: {
    //   // mongodb 数据库连接字符串
    //   url: 'mongodb://localhost:27017/hello'
    // }
  }

  // the return config will combines to EggAppConfig
  // config 和 bizConfig 都是有类型的，但是经过扩展之后，导致当前函数的返回值类型为 any
  // 原因是 config 扩展之后影响了 bizConfig
  // https://www.eggjs.org/zh-CN/tutorials/typescript#配置config
  return {
    // 使用类型断言，让 config 扩展之后不影响 bizConfig 扩展的类型
    ...(config as {}),
    ...bizConfig
  }
}
