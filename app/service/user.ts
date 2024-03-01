import { UserProps } from 'app/model/user'
import { Service } from 'egg'
import { Query } from 'mongoose'
// 阿里云短信服务
import * as $Dysmsapi from '@alicloud/dysmsapi20170525'

// https://gitee.com/api/v5/swagger#/getV5User
// 只给一些用到的字段设置类型
interface GiteeUserResp {
  id: number
  login: string
  name: string
  avatar_url: string
  email: string
}

export default class UserService extends Service {
  // https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
  /**
   * 创建并向数据表中插入一条新数据
   * @param {UserProps} payload 参数负载
   * @return {Promise<any>} 新增结果
   */
  async createByEmail(payload: UserProps): Promise<any> {
    const { ctx } = this
    const { username, password } = payload
    const hash = await ctx.genHash(password)
    // Partial<UserProps>：返回 UserProps 全部变为可选的新类型
    const userCreatedData: Partial<UserProps> = {
      username,
      // 设置密码为加密后的 hash 值
      password: hash,
      email: username
    }
    return ctx.model.User.create(userCreatedData)
  }
  /**
   * 根据 id 查找记录
   * @param id 集合中某一条记录的 id
   * @return {Query<any, any, {}, any, "findOne">} 查找结果
   */
  async findById(id: string): Promise<Query<any, any, {}, any, 'findOne'>> {
    return this.ctx.model.User.findById(id)
  }
  // 根据用户名 username 查找用户
  async findByUsername(username: string) {
    return this.app.model.User.findOne({ username })
  }
  // 使用阿里云短信服务发送短信
  async sendSMS(phoneNumber: string, veriCode: string) {
    // https://api.aliyun.com/api/Dysmsapi/2017-05-25/SendSms?tab=DEMO&lang=TYPESCRIPT&params={}
    const { app } = this
    // https://api.aliyun.com/api/Dysmsapi/2017-05-25/SendSms?tab=DOC&lang=TYPESCRIPT&params={}
    const sendSMSRequest = new $Dysmsapi.SendSmsRequest({
      // 接收短信的手机号码
      phoneNumbers: phoneNumber,
      // 短信签名名称
      signName: '慕课乐高',
      // ? 短信模板 Code：自定义模板需要手动创建，提交审核资料，然后等待审核通过
      // * [如何申请短信签名和模板 ？](https://help.aliyun.com/zh/idaas/security-authentication/support/manage-sms-signatures-and-templates)
      // 注意：对于个人认证用户，短信签名申请内容必须为已上线App名称、已在工信部备案的网站名称等，暂不支持个人用户申请未上线的业务。
      // https://dysms.console.aliyun.com/quickstart?spm=5176.25163407.domtextsigncreate-index-1ec3c_58c50_0.1.6d54bb6eXfPg3x
      // ! 注意：只有申请了自定义模板（申请签名，认证通过后，配置签名后），才可以发送短信验证码
      // ! 注意：没有配置签名的模板只能用于在阿里云短信控制台发送测试短信，无法通过 API 的方式集成到应用中
      // 也就是想要正常使用短信服务，需要先申请创建一个签名，申请通过后，再使用该签名创建短信自定义模板，然后才可以在应用中正常使用
      // https://dysms.console.aliyun.com/domestic/text/template
      templateCode: 'SMS_295405497',
      // 短信模板变量对应的实际值：code 就是要发送的验证码
      templateParam: `{"code": "${veriCode}"}`
    })
    // 发送短信
    const resp = await app.ALClient.sendSms(sendSMSRequest)
    return resp
  }
  // 使用手机号码登录，如果账户不存在，则创建新账户，最后返回 token
  async loginByCellphone(cellphone: string) {
    const { ctx, app } = this
    const user = await this.findByUsername(cellphone)
    // 检查 user 记录是否存在
    if (user) {
      // generate token
      const token = app.jwt.sign(
        { username: user.username, _id: user._id },
        app.config.jwt.secret,
        { expiresIn: app.config.jwtExpires }
      )
      return token
    }
    // 用户不存在时，执行创建新用户操作
    const userCreateData: Partial<UserProps> = {
      username: cellphone,
      phoneNumber: cellphone,
      // 默认格式：'lego' + 手机号码后4位
      nickname: `lego-${cellphone.slice(-4)}`,
      type: 'cellphone'
    }
    const newUser = await ctx.model.User.create(userCreateData)
    // generate token
    const token = app.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      app.config.jwt.secret,
      { expiresIn: app.config.jwtExpires }
    )
    return token
  }
  // get access token
  // Egg.js 内置的 HttpClient：https://www.eggjs.org/zh-CN/core/httpclient
  async getAccessToken(code: string) {
    const { ctx, app } = this
    const { cid, secret, redirectURL, authURL } = app.config.giteeOauthConfig
    const { data } = await ctx.curl(authURL, {
      // 必须指定 method
      method: 'POST',
      // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
      contentType: 'json',
      // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
      dataType: 'json',
      data: {
        code,
        client_id: cid,
        client_secret: secret,
        redirect_uri: redirectURL
      }
    })
    app.logger.info(data)
    return data.access_token
  }
  // get gitee user data
  // https://gitee.com/api/v5/swagger#/getV5User
  async getGiteeUserData(access_token: string) {
    const { ctx, app } = this
    const { giteeUserApi } = app.config.giteeOauthConfig
    // ctx.curl<T> 设置返回的数据中的 data 字段的类型
    const { data } = await ctx.curl<GiteeUserResp>(giteeUserApi, {
      // 没有指定 method 时，method 默认值为 GET
      // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
      dataType: 'json',
      data: {
        access_token
      }
    })
    return data
  }
  // 使用 gitee 的 oauth 授权登录
  async loginByGitee(code: string) {
    const { ctx, app } = this
    // 获取 access_token
    const access_token = await this.getAccessToken(code)
    // 获取用户信息
    const user = await this.getGiteeUserData(access_token)
    // 检查用户信息是否存在（在我们的网站注册了帐号？）
    const { id, name, avatar_url, email } = user
    // id 默认为 number 类型，需要将其转换为 string
    const stringId = id.toString()
    // ? oauth 授权登录时注册的用户名格式
    // gitee：Gitee + id
    // github：Github + id
    // 微信：WX + id
    const GITEE_OAUTH_USERNAME = `Gitee${stringId}`
    const existsUser = await this.findByUsername(GITEE_OAUTH_USERNAME)
    // 用户已经注册，直接生成 token 返回
    if (existsUser) {
      // generate token
      const token = app.jwt.sign(
        { username: existsUser.username, _id: existsUser._id },
        app.config.jwt.secret,
        { expiresIn: app.config.jwtExpires }
      )
      return token
    }
    // 用户没有注册，执行新建用户操作
    const userCreateData: Partial<UserProps> = {
      type: 'oauth',
      oauthID: stringId,
      provider: 'gitee',
      username: GITEE_OAUTH_USERNAME,
      picture: avatar_url,
      nickname: name,
      email: email ?? ''
    }
    const newUser = await ctx.model.User.create(userCreateData)
    // generate token
    const token = app.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      app.config.jwt.secret,
      { expiresIn: app.config.jwtExpires }
    )
    return token
  }
}
