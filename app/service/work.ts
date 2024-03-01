import { IndexCondition } from '@/controller/work'
import { WorkProps } from '@/model/work'
import { Service } from 'egg'
import { Types } from 'mongoose'
// nanoid do not support CommonJS environment for 4.x and 5.x (there is 3.x branch still supported for legacy environments).
// ? 也就是说，只有 3.x 版本以下才同时支持 CommonJS 规范 和 ESModule 规范
// ? 当前创建的 Egg 项目默认使用的是 CommonJS 规范
// cnpm i nanoid@3
import { nanoid } from 'nanoid'

// Required<T> 返回一个新类型：T类型字段全部为必选
const defaultIndexCondition: Required<IndexCondition> = {
  pageIndex: 0,
  pageSize: 10,
  select: '',
  populate: { path: '' },
  customSort: { createdAt: -1 },
  find: {}
}

export default class WorkService extends Service {
  async createEmptyWork(payload: any) {
    const { ctx } = this
    const { username, _id } = ctx.state.user
    // 创建一个独一无二的 URL id（位数：6位）
    // https://www.npmjs.com/package/nanoid
    const uuid = nanoid(6)
    const newEmptyWork: Partial<WorkProps> = {
      ...payload,
      // 将 _id 转换为 ObjectId 类型
      // 在当前版本中，已经不推荐使用 new Types.ObjectId() 的方式创建
      // user: new Types.ObjectId(_id),
      // _id 是一个十六进制字符串
      user: Types.ObjectId.createFromHexString(_id),
      author: username,
      uuid
    }
    // 将模板 newEmptyWork 保存到数据库中
    return ctx.model.Work.create(newEmptyWork)
  }
  async getList(condition: IndexCondition) {
    const finalCondition = { ...defaultIndexCondition, ...condition }
    const { pageIndex, pageSize, select, populate, customSort, find } =
      finalCondition
    const skip = pageIndex * pageSize
    const res = await this.ctx.model.Work.find(find)
      .select(select)
      // https://mongoosejs.com/docs/api/document.html#Document.prototype.populate()
      // 填充字段：populate.path
      // 填充字段的值：populate.select 中的字段，默认会添加 _id 字段
      .populate(populate)
      .skip(skip)
      .limit(pageSize)
      .sort(customSort)
    // https://mongoosejs.com/docs/api/query.html#Query.prototype.lean()
    // 查询更快，返回的数据量更小，返回的 Document（一行记录）是一个纯 JS 对象
    // .lean()
    // ? 获取满足条件的文档的长度
    // 在当前版本中，将 count() 替换为 countDocuments() / estimatedDocumentCount()
    // countDocuments()：符合查询条件的数目长度
    // estimatedDocumentCount()：忽略查询条件，返回所有数据的数目长度
    const count = await this.ctx.model.Work.find(find).countDocuments()
    return { count, list: res, pageSize, pageIndex }
  }
  /**
   * 发布作品，同时返回显示该作品的 h5 页面链接地址
   * @param id 作品 id
   * @param isTemplate 是否为模板
   * @return {Promise<string>} h5 页面链接地址
   */
  async publish(id: number, isTemplate = false): Promise<string> {
    const { ctx } = this
    const { H5BaseURL } = ctx.app.config
    const payload: Partial<WorkProps> = {
      // 作品状态：0-删除，1-未发布，2-发布，3-管理员强制下线
      status: 2,
      // 最新发布时间
      latestPublishAt: new Date(),
      // 是否为模板
      ...(isTemplate && { isTemplate: true })
    }
    const res = await ctx.model.Work.findOneAndUpdate({ id }, payload, {
      // 返回值为更新后的数据
      new: true
    })
    return `${H5BaseURL}/p/${id}-${res?.uuid}`
  }
}
