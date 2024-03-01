import { Controller } from 'egg'
// import jwt from 'jsonwebtoken'
import {
  USER_VALIDATE_FAIL,
  USER_ALREADY_EXISTS,
  LOGIN_CHECK_FAIL_INFO,
  LOGIN_VALIDATE_FAIL,
  SEND_VERI_CODE_FREQUENTLY_FAIL_INFO,
  LOGIN_VERI_CODE_INCORRECT_FAIL_INFO,
  SEND_VERI_CODE_ERROR,
  GITEE_OAUTH_ERROR
} from '@/const/user'
import inputValidate from '@/decorator/inputValidate'

/** egg-validate 验证规则 */
// 通过邮箱登录/注册：校验邮箱格式和密码
const userCreateRules = {
  username: 'email',
  password: { type: 'password', min: 8 }
}
const PHONE_NUMBER = 'phoneNumber'
// 使用手机号码注册/登录：校验手机号码和验证码
const userPhoneCreateRules = {
  [PHONE_NUMBER]: {
    type: 'string',
    format: /^1[3-9]\d{9}$/,
    message: {
      // 对应 format 字段规则
      format: '手机号码格式错误'
    }
  },
  veriCode: {
    type: 'string',
    format: /^\d{4}$/,
    message: { format: '验证码格式错误' }
  }
}
// 发送验证码：手机号码格式校验
const sendCodeRules = {
  [PHONE_NUMBER]: {
    type: 'string',
    format: /^1[3-9]\d{9}$/,
    message: {
      // 对应 format 字段规则
      format: '手机号码格式错误'
    }
  }
}

/**
 * 根据手机号码生成缓存验证码的 key
 * @param {string} phoneNumber  手机号码
 * @return {string} redis key
 */
function getVeriCodeRedisKey(phoneNumber: string): string {
  return `phoneVeriCode-${phoneNumber}`
}

// https://www.eggjs.org/zh-CN/basics/controller#controller-类推荐
export default class UserController extends Controller {
  // 通过邮箱注册账户
  @inputValidate(userCreateRules, USER_VALIDATE_FAIL)
  async createByEmail() {
    const { ctx, service } = this
    // ? 参数验证：在运行时会自动获取 ctx.request.body 作为验证数据源
    // https://github.com/node-modules/parameter#rule
    // * 方式一：遇到错误时，直接将错误响应给客户端，而不是中断代码的执行
    // ctx.validate(userCreateRules)
    // * 方式二：有错误时返回 ValidateError[]，验证通过时返回 undefined
    // const errors = app.validator.validate(userCreateRules, ctx.request.body)
    // app.logger.warn(errors)
    // if (errors) {
    //   // 验证失败
    //   return ctx.helper.error({
    //     ctx,
    //     errorType: USER_VALIDATE_FAIL,
    //     error: errors
    //   })
    // }
    const { username } = ctx.request.body
    const user = await service.user.findByUsername(username)
    if (user) {
      return ctx.helper.error({
        ctx,
        errorType: USER_ALREADY_EXISTS
      })
    }

    // https://www.eggjs.org/zh-CN/basics/controller#body
    // 常见错误：将 ctx.request.body 与 ctx.body 混淆，后者实际上是 ctx.response.body 的简写（给客户端返回数据）。
    const userData = await service.user.createByEmail(ctx.request.body)
    ctx.helper.success({ ctx, res: userData, msg: '创建用户成功' })
  }
  /**
   * 验证用户提交的 body 数据
   * @return {ValidateError[]} 验证失败的信息对象
   */
  // validateUserInput(rules: any): ValidateError[] | undefined {
  //   const { ctx, app } = this
  //   // ? 参数验证：在运行时会自动获取 ctx.request.body 作为验证数据源
  //   // https://github.com/node-modules/parameter#rule
  //   // * 方式一：遇到错误时，直接将错误响应给客户端，而不是中断代码的执行
  //   // ctx.validate(userCreateRules)
  //   // * 方式二：有错误时返回 ValidateError[]，验证通过时返回 undefined
  //   const errors = app.validator.validate(rules, ctx.request.body)
  //   // 有错误才打印
  //   errors && app.logger.warn(errors)
  //   return errorsUSER_VALIDATE_FAIL
  // }
  // 发送验证码
  @inputValidate(sendCodeRules, USER_VALIDATE_FAIL)
  async sendVeriCode() {
    const { ctx, app, service } = this
    const { phoneNumber } = ctx.request.body
    // 检查用户输入
    // const error = this.validateUserInput(sendCodeRules)
    // if (error) {
    //   // 验证失败
    //   return ctx.helper.error({
    //     ctx,
    //     error,
    //     errorType: USER_VALIDATE_FAIL
    //   })
    // }
    // 获取 redis 的数据
    // redis 验证码的 key 命名格式：phoneVeriCode-用户手机号
    const veriCodeKey = getVeriCodeRedisKey(phoneNumber)
    const preVeriCode = await app.redis.get(veriCodeKey)
    // 判断是否存在
    if (preVeriCode) {
      return ctx.helper.error({
        ctx,
        errorType: SEND_VERI_CODE_FREQUENTLY_FAIL_INFO
      })
    }
    // [0, 1) * 9000 = [0, 9000)
    // [0, 9000) + 1000 = [1000, 10000)
    // 向下取整后，可得 [1000, 9999] 范围内的 4 位验证码字符串
    const veriCode = Math.floor(Math.random() * 9000 + 1000).toString()
    // ? 只有生产环境下，即项目打包部署上线之后，才发送真实短信（节省资源-省钱）
    // https://www.eggjs.org/zh-CN/basics/env#应用内获取运行环境
    // * tip：app.config.env 获取的是 EGG_SERVER_ENV
    if (app.config.env === 'prod') {
      // ? 使用阿里云短信服务发送短信验证码
      // https://next.api.aliyun.com/api/Dysmsapi/2017-05-25/SendSms
      const resp = await service.user.sendSMS(phoneNumber, veriCode)
      // code: 请求状态码
      if (resp.body.code !== 'OK') {
        // 验证码发送失败
        app.logger.warn(resp.body.message)
        return ctx.helper.error({ ctx, errorType: SEND_VERI_CODE_ERROR })
      }
    }

    // 缓存验证码到 redis 中
    // EX 或者 ex，设置过期时间为 60 秒，超过时间后自动销毁该 key
    await app.redis.set(veriCodeKey, veriCode, 'EX', 60)
    // 给客户端发送验证码
    ctx.helper.success({
      ctx,
      msg: '验证码发送成功',
      // 开发环境下，直接返回验证码 veriCode，生产环境下返回 null
      // tip：生产环境下，是通过阿里云短信服务来给用户手机号码发送验证码（详见上面代码）
      res: app.config.env === 'local' ? { veriCode } : null
    })
  }
  // 通过邮箱登录
  @inputValidate(userCreateRules, USER_VALIDATE_FAIL)
  async loginByEmail() {
    const { ctx, service, app } = this
    // 检查用户的输入
    // const error = this.validateUserInput(userCreateRules)
    // if (error) {
    //   // 验证失败
    //   return ctx.helper.error({
    //     ctx,
    //     error,
    //     errorType: USER_VALIDATE_FAIL
    //   })
    // }
    // 根据 username 取得用户信息
    const { username, password } = ctx.request.body
    const user = await service.user.findByUsername(username)
    // 检查用户是否存在
    if (!user) {
      return ctx.helper.error({
        ctx,
        errorType: LOGIN_CHECK_FAIL_INFO
      })
    }
    // 验证用户密码：compare(用户输入的密码, 数据库中保存的加密后的 hash 字符串)
    // 如果 password 加密后等于 user.password，则验证成功，返回 true
    const verifyPwd = await ctx.compare(password, user.password)
    if (!verifyPwd) {
      return ctx.helper.error({
        ctx,
        errorType: LOGIN_CHECK_FAIL_INFO
      })
    }

    // ? 设置 cookie
    // https://www.eggjs.org/zh-CN/core/cookie-and-session
    // ctx.cookies.set('username', user.username, { encrypt: true })
    // ? 设置 session（直接设置和读取）
    // ctx.session.username = user.username

    // ? 生成 token
    // * payload 的构成：
    //    1. Registered claims 注册相关的信息
    //    2. Public claims 公共信息：shoul be unique like email, address or phone_number
    const payload = {
      username: user.username,
      _id: user._id
    }
    // ? 生成 token
    // * 注：后面通过 app.jwt.verify 校验时，默认会将解析后的 payload 保存到 ctx.state.user 中
    // const token = jwt.sign(payload, app.config.jwt.secret, {
    const token = app.jwt.sign(payload, app.config.jwt.secret, {
      expiresIn: app.config.jwtExpires // 设置过期时间
    })

    // ? 一般返回给客户端的用户信息中应该过滤掉 password 字段
    // toJson 和 toObject 的作用相同
    // const userObj = user.toJSON()
    // // @ts-expect-error 测试删除 password 字段
    // delete userObj.password
    // 验证成功，返回用户信息
    ctx.helper.success({
      ctx,
      // res: userObj,
      // res: user,
      res: { token },
      msg: '登陆成功'
    })
  }
  // 通过手机号码登录
  @inputValidate(userPhoneCreateRules, USER_VALIDATE_FAIL)
  async loginByCellphone() {
    const { ctx, app, service } = this
    const { phoneNumber, veriCode } = ctx.request.body
    // 检查用户输入
    // const error = this.validateUserInput(userPhoneCreateRules)
    // if (error) {
    //   return ctx.helper.error({ ctx, errorType: USER_VALIDATE_FAIL, error })
    // }
    // 验证码是否正确
    const preVeriCode = await app.redis.get(getVeriCodeRedisKey(phoneNumber))
    if (preVeriCode !== veriCode) {
      // 验证码不正确
      return ctx.helper.error({
        ctx,
        errorType: LOGIN_VERI_CODE_INCORRECT_FAIL_INFO
      })
    }
    // 执行登录操作
    const token = await service.user.loginByCellphone(phoneNumber)
    ctx.helper.success({ ctx, res: { token } })
  }
  /** 获取并校验 token */
  // getTokenValue() {
  //   // JWT Header 格式：Authorization: 'Bearer token'
  //   const { ctx } = this
  //   const { authorization } = ctx.header
  //   // 没有这个 header，直接返回 false
  //   if (!ctx.header || !authorization) {
  //     return false
  //   }
  //   if (typeof authorization === 'string') {
  //     const parts = authorization.trim().split(' ')
  //     if (parts.length === 2) {
  //       const schema = parts[0]
  //       // token
  //       const credentials = parts[1]
  //       console.log(
  //         '🚀 ~ UserController ~ getTokenValue ~ credentials:',
  //         credentials
  //       )
  //       if (/^Bearer$/i.test(schema)) {
  //         return credentials
  //       }
  //       return false
  //     }
  //   }
  //   return false
  // }
  // 根据 _id 查找用户
  // ? 根据 token 查找用户
  async show() {
    const { ctx, service } = this

    // ? 验证token
    // 如果是 无效的token, jwt.verify 方法则会报异常 JsonWebTokenError: invalid token, 所以使用 try...catch 捕获异常
    // 加密和解密使用的使用一个 secretKey, 容易导出安全隐患
    // try {
    //   // 1. 获取 token
    //   const token = this.getTokenValue()
    //   if (!token) {
    //     return ctx.helper.error({ ctx, errorType: LOGIN_VALIDATE_FAIL })
    //   }
    //   // 2. 验证 token
    //   const decoded = jwt.verify(token, app.config.secret)
    //   // 3. 给客户端响应验证结果
    //   return ctx.helper.success({ ctx, res: decoded })
    // } catch (error) {
    //   // 3. 给客户端响应验证结果
    //   return ctx.helper.error({ ctx, errorType: LOGIN_VALIDATE_FAIL })
    // }

    // ? 上面的逻辑已经抽离为一个单独的可复用的中间件 jwt, decoded 经过该中间件的处理后, 解析后得到的 decoded 数据保存在 ctx.state.user
    const userData = await service.user.findByUsername(ctx.state.user.username)
    console.log('🚀 ~ show ~ ctx.state.user.username:', ctx.state.user.username)
    // 通过 app/model/user.ts 中的 Schema 中的配置 toJSON.transform 方法过滤掉一些无用数据
    // tip: 密码字段 password 不需要返回给用户
    ctx.helper.success({ ctx, res: userData?.toJSON() })

    // ? ctx.params：获取经过解析的查询字符串数据
    // /users/:id
    // const userData = await service.user.findById(ctx.params.id)
    // ctx.helper.success({ ctx, res: userData })
  }
  /** 测试 Cookie 的使用 */
  async getTestCookie() {
    const { ctx } = this
    // ? 读取 cookie 数据
    // https://www.eggjs.org/zh-CN/core/cookie-and-session
    const username = ctx.cookies.get('username', { encrypt: true })
    ctx.helper.success({ ctx, res: username })
  }
  /** 测试 Session 的使用 */
  async getTestSession() {
    const { ctx } = this
    // ? 读取 session 数据（直接设置和读取）
    // https://www.eggjs.org/zh-CN/core/cookie-and-session#session
    const { username } = ctx.session
    if (!username) {
      return ctx.helper.error({ ctx, errorType: LOGIN_VALIDATE_FAIL })
    }
    ctx.helper.success({ ctx, res: username })
  }
  /** gitee oauth 授权 */
  // https://gitee.com/api/v5/oauth_doc#/list-item-1
  async oauth() {
    const { ctx, app } = this
    const { cid, redirectURL } = app.config.giteeOauthConfig
    // ? 与 授权码模式 中的选项 A 保持一致
    // 目前是在后台 API 项目中使用，所有使用的是路由重定向的方式进行跳转测试
    // 在前端项目中，可以直接通过一个 a 链接跳转即可
    // ? 客户端重定向
    // https://www.eggjs.org/zh-CN/basics/controller#重定向
    ctx.redirect(
      `https://gitee.com/oauth/authorize?client_id=${cid}&redirect_uri=${redirectURL}&response_type=code`
    )
  }
  async oauthByGitee() {
    const { ctx, service } = this
    // 获取用户授权码
    const { code } = ctx.request.query
    try {
      // 获取 token 登录凭证
      const token = await service.user.loginByGitee(code)
      // https://www.eggjs.org/zh-CN/core/view#渲染页面
      // render a template, path related to `app/view`
      // 参数2 中的字段可以在参数1模板中通过 {{token}} 使用
      await ctx.render('success.nj', { token })
      // if (token) {
      //   ctx.helper.success({ ctx, res: { token } })
      // }
    } catch (e) {
      ctx.helper.error({ ctx, errorType: GITEE_OAUTH_ERROR })
    }
  }
}
