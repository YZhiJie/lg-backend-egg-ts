import { EggPlugin } from 'egg'

const plugin: EggPlugin = {
  tegg: {
    enable: true,
    package: '@eggjs/tegg-plugin'
  },
  teggConfig: {
    enable: true,
    package: '@eggjs/tegg-config'
  },
  teggController: {
    enable: true,
    package: '@eggjs/tegg-controller-plugin'
  },
  teggSchedule: {
    enable: true,
    package: '@eggjs/tegg-schedule-plugin'
  },
  eventbusModule: {
    enable: true,
    package: '@eggjs/tegg-eventbus-plugin'
  },
  aopModule: {
    enable: true,
    package: '@eggjs/tegg-aop-plugin'
  },
  tracer: {
    enable: true,
    package: 'egg-tracer'
  },
  // ? 启用插件
  // https://www.eggjs.org/zh-CN/basics/plugin#使用插件
  // 自定义插件名称
  mongoose: {
    // 启用插件
    enable: true,
    // 当前插件对应的 npm 依赖包名称
    package: 'egg-mongoose'
  },
  // 配置完成之后，就可以通过 ctx.validate 引用
  validate: {
    enable: true,
    package: 'egg-validate'
  },
  // bcrypt 加密
  bcrypt: {
    enable: true,
    package: 'egg-bcrypt'
  },
  // egg-jwt token 验证
  // https://www.npmjs.com/package/egg-jwt
  jwt: {
    enable: true,
    package: 'egg-jwt'
  },
  // egg-redis
  // https://www.npmjs.com/package/egg-redis
  redis: {
    enable: true,
    package: 'egg-redis'
  },
  // egg-view-nunjucks
  // https://www.eggjs.org/zh-CN/core/view
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks'
  },
  // egg-cors：支持跨域
  // https://www.npmjs.com/package/egg-cors
  cors: {
    enable: true,
    package: 'egg-cors'
  },
  // https://www.npmjs.com/package/egg-oss
  oss: {
    enable: true,
    package: 'egg-oss'
  }
}

export default plugin
