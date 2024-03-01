import { Controller } from 'egg'

export default class TestController extends Controller {
  async index() {
    const { ctx, service } = this
    // 获取动态路由参数
    const { params } = ctx
    // 查询字符串参数，post 请求 body 数据
    const { query, body } = ctx.request
    // 获取自定义配置项
    const { baseUrl } = ctx.app.config
    // 通过 axios 请求网络数据
    const res = await this.app.axiosInstance.get('/api/breeds/image/random')
    // https://www.eggjs.org/zh-CN/core/development#调试
    // ctx.logger.debug('debug')
    // ctx.logger.info('res.data:', res.data)
    // ctx.logger.warn('warning')
    // ctx.logger.error(new Error('error message'))
    // ? 获取数据库数据
    const persons = await service.dog.showPlayers()
    // ? 给客户端响应数据
    const resp = {
      query,
      params,
      body,
      baseUrl,
      dogData: res.data,
      persons
    }
    // ctx.body = resp
    // 获取自定义配置
    // ctx.status = 200
    ctx.helper.success({
      ctx,
      res: resp
    })
    // http://127.0.0.1:7001/test/2?name=zhangsan&age=18
  }
  async getDog() {
    const { service, ctx } = this
    const resp = await service.dog.show()
    // ctx.body = resp.message
    // ctx.status = 200
    ctx.helper.success({ ctx, res: resp.message })
    // http://127.0.0.1:7001/dog
  }
}
