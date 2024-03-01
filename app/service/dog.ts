import { Service } from 'egg'

export default class DogService extends Service {
  async show() {
    // Dog API 地址：https://dog.ceo/api/breeds/image/random
    // Egg.js 内置的 HttpClient：https://www.eggjs.org/zh-CN/core/httpclient
    const resp = await this.ctx.curl(
      'https://dog.ceo/api/breeds/image/random',
      {
        // 返回 json 格式数据
        dataType: 'json'
      }
    )
    // 返回数据
    return resp.data
  }
  async showPlayers() {
    // 获取 age > 20 的前 100 条数据
    const result = await this.ctx.model.User.find({
      age: { $gt: 20 }
    })
      .limit(100)
      .exec()
    return result
  }
}
