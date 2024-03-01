import { EggAppConfig, PowerPartial } from 'egg'

// 在 production 模式下，会同时加载两个文件的配置
// config.default.ts 和 config.prod.ts
// 两个文件的配置会合并，同时 config.prod.ts 的同名配置优先级更高（会覆盖默认配置）
export default () => {
  const config: PowerPartial<EggAppConfig> = {}
  config.baseUrl = 'prod.url'
  // TODO： 1. 给 mongoDB 和 redis 添加密码
  // config.mongoose = {
  //   url: 'xxx',
  //   options: {
  //     dbName: 'lego',
  //     user: 'xyz',
  //     pass: 'pass'
  //   }
  // }
  // config.redis = {
  //   client: {
  //     port: 6379,
  //     host: '127.0.0.1',
  //     password: 'redispass',
  //     db: 0
  //   }
  // }
  // 2. 配置 cors 允许的域名
  config.security = {
    domainWhiteList: ['https://imooc-lego.com', 'https://www.imooc-lego.com']
  }
  // 3. 配置 jwt token 的过期时间为 2 天
  config.jwtExpires = '2 days'
  // 4. 本地的 URL 替换
  config.giteeOauthConfig = {
    redirectURL: 'https://api.imooc-lego.com/api/users/passport/gitee/callback'
  }
  config.H5BaseURL = 'https://h5.imooc-lego.com'

  // docker run -d --network lego --name mongo -p 27017:27017 mongo
  config.mongoose = {
    // ? 使用 docker 启动
    // 就是将 localhost 修改为上面的 docker 命令中的 --name 后面设置的容器别名
    url: 'mongodb://lego-mongo:27017/lego-backend',
    options: {
      // 认证账户
      user: process.env.MONGO_DB_USERNAME,
      pass: process.env.MONGO_DB_PASSWORD
    }
  }
  config.redis = {
    client: {
      port: 6379,
      // docker redis 容器名称
      host: 'lego-redis',
      password: process.env.REDIS_PASSWORD
    }
  }
  return config
}
