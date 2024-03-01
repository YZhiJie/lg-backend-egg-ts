import { Controller } from 'egg'
import { WORK_NO_PERMISSION_FAIL, WORK_VALIDATE_FAIL } from '@/const/work'
import inputValidate from '@/decorator/inputValidate'
import checkPermission from '@/decorator/checkPermission'
import { nanoid } from 'nanoid'

// ? egg-validate 参数验证规则
const workCreateRule = {
  title: 'string'
}

const channelCreateRule = {
  name: 'string',
  workId: 'number'
}

export interface IndexCondition {
  pageIndex?: number
  pageSize?: number
  // 需要获取的字段
  select?: string | string[]
  populate?: { path: string; select?: string }
  // Record<keyType, valueType>：限定一个对象的 key 和 value 的类型
  // 自定义排序：-1 为降序，1为正序
  customSort?: Record<string, any>
  // 查找条件
  find?: Record<string, any>
}

export default class WorkController extends Controller {
  // 为现有作品添加新频道
  @inputValidate(channelCreateRule, 'channelValidateFail')
  @checkPermission(
    { mongoose: 'Work', casl: 'Channel' },
    'workNoPermissionFail',
    { value: { type: 'body', valueKey: 'workId' } }
  )
  async createChannel() {
    const { ctx } = this
    const { name, workId } = ctx.request.body
    const newChannel = { name, id: nanoid(6) }
    const res = await ctx.model.Work.findOneAndUpdate(
      { id: workId },
      // ? 新增一项
      { $push: { channels: newChannel } }
      // ? 新增多项
      // { $push: { channels: { $each: [newChannel, newChannel2] } } }
    )
    if (res) {
      return ctx.helper.success({ ctx, res: newChannel, msg: '创建成功' })
    }
    ctx.helper.error({ ctx, errorType: 'channelOperateFail' })
  }
  // 根据 id 获取作品频道
  @checkPermission(
    { mongoose: 'Work', casl: 'Channel' },
    'workNoPermissionFail'
  )
  async getWorkChannel() {
    const { ctx } = this
    const { id } = ctx.params
    const certainWork = await ctx.model.Work.findOne({ id })
    if (!certainWork) {
      return ctx.helper.error({ ctx, errorType: 'workNoFound' })
    }
    const { channels } = certainWork
    ctx.helper.success({
      ctx,
      res: {
        // count: certainWork.channels?.length || 0,
        count: (channels && channels.length) || 0,
        list: certainWork.channels || []
      }
    })
  }
  // 更新渠道名称
  @checkPermission(
    { mongoose: 'Work', casl: 'Channel' },
    'workNoPermissionFail',
    { key: 'channels.id' }
  )
  async updateChannelName() {
    const { ctx } = this
    // channel 的 id
    const { id } = ctx.params
    const { name } = ctx.request.body
    // https://www.mongodb.com/docs/manual/core/document/#dot-notation
    // https://www.mongodb.com/docs/manual/tutorial/query-array-of-documents/
    const res = await ctx.model.Work.findOneAndUpdate(
      { 'channels.id': id },
      {
        // 这里的 $ 就是查到的那一项的索引值
        // $ 可以为 0,1,2,...，分别表示数组的第一个元素，第二个元素, ...
        $set: { 'channels.$.name': name }
      }
    )
    if (!res) {
      return ctx.helper.error({ ctx, errorType: 'channelOperateFail' })
    }
    ctx.helper.success({ ctx, res: { name }, msg: '更新成功' })
  }
  // 删除渠道名称
  @checkPermission(
    { mongoose: 'Work', casl: 'Channel' },
    'workNoPermissionFail',
    { key: 'channels.id' }
  )
  async deleteChannel() {
    const { ctx } = this
    const { id } = ctx.params
    const workData = await ctx.model.Work.findOneAndUpdate(
      {
        // 查找 channels 字段数组中 id 等于客户端传入的 id 的元素
        'channels.id': id
      },
      {
        // 删除 channels 字段数组中 id 等于客户端传入的 id 的元素
        $pull: { channels: { id } }
      },
      {
        // 返回更新后的数据
        new: true
      }
    )
    if (!workData) {
      return ctx.helper.error({ ctx, errorType: 'channelOperateFail' })
    }
    ctx.helper.success({ ctx, res: workData })
  }
  @inputValidate(workCreateRule, WORK_VALIDATE_FAIL)
  @checkPermission('Work', 'workNoPermissionFail')
  async createWork() {
    const { ctx, service } = this
    const workData = await service.work.createEmptyWork(ctx.request.body)
    // 创建作品成功，给客户端响应数据
    return ctx.helper.success({ ctx, res: workData, msg: '创建模板成功' })
  }
  // 获取当前用户创建的作品列表
  @checkPermission('Work', 'workNoPermissionFail')
  async myList() {
    const { ctx, service } = this
    const userId = ctx.state.user._id
    const { pageIndex, pageSize, isTemplate, title } = ctx.query
    const findCondition = {
      user: userId,
      // https://www.mongodb.com/docs/manual/reference/operator/query/regex/
      // 使用正则表达式匹配 title，忽略大小写
      // $regex: title => 只要包含 title 即可
      ...(title && { title: { $regex: title, $options: 'i' } }),
      // isTemplate 在编码时为数值类型，1 表示为 true, 0 表示为 false
      // ? isTemplate 在数据库集合中的类型为 boolean
      ...(isTemplate && { isTemplate: !!parseInt(isTemplate) })
    }
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      // 之所以可以获取到 user Collection 的字段是因为当前 Collection Model 中设置了一个字段 user 引用自 User Collection，所以在查询的时候会关联查询（把两个表连接到一起）
      populate: { path: 'user', select: 'username nickname picture' },
      // "user": {
      //     "_id": "65d46e10f0ef9cf84540aed3",
      //     "username": "Gitee5002247",
      //     "nickname": "yang_zhijie",
      //     "picture": "https://gitee.com/assets/no_portrait.png"
      // },
      find: findCondition,
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) })
    }
    const res = await service.work.getList(listCondition)
    ctx.helper.success({ ctx, res })
  }
  // 根据传入的动态路由参数 id 获取自己的某个作品
  @checkPermission('Work', 'workNoPermissionFail')
  async myWork() {
    const { ctx } = this
    const { id } = ctx.params
    const res = await this.ctx.model.Work.findOne({ id }).lean()
    ctx.helper.success({ ctx, res })
  }
  // 获取当前用户发布的模板列表
  async templateList() {
    const { ctx } = this
    const { pageIndex, pageSize } = ctx.query
    const listCondition: IndexCondition = {
      select: 'id author copiedCount coverImg desc title user isHot createdAt',
      populate: { path: 'user', select: 'username nickname picture' },
      find: { isPublic: true, isTemplate: true },
      ...(pageIndex && { pageIndex: parseInt(pageIndex) }),
      ...(pageSize && { pageSize: parseInt(pageSize) })
    }
    const res = await ctx.service.work.getList(listCondition)
    ctx.helper.success({ ctx, res })
  }
  async template() {
    const { ctx } = this
    const { id } = ctx.params
    // https://mongoosejs.com/docs/api/query.html#Query.prototype.lean()
    // 查询更快，返回的数据量更小，返回的 Document（一行记录）是一个纯 JS 对象
    const res = await this.ctx.model.Work.findOne({ id }).lean()
    if (!res?.isPublic || !res?.isTemplate) {
      return ctx.helper.error({ ctx, errorType: 'workNoPublicFail' })
    }
    ctx.helper.success({ ctx, res })
  }
  // 检查用户操作权限：作品的 user 字段需要等于当前用户的 _id（ctx.state.user._id）
  // async checkPermission(id: number): Promise<boolean> {
  //   const { ctx } = this
  //   // 获取当前用户的 ID
  //   const userId = ctx.state.user._id
  //   // 查询作品信息
  //   const certainWork = await ctx.model.Work.findOne({ id })
  //   if (!certainWork) {
  //     return false
  //   }
  //   // certainWork.user 是 ObjectId 类型
  //   return certainWork.user.toString() === userId
  // }
  @checkPermission('Work', WORK_NO_PERMISSION_FAIL)
  async update() {
    const { ctx } = this
    const { id } = ctx.params
    // const hasPermission = await this.checkPermission(id)
    // if (!hasPermission) {
    //   // 没有权限执行当前操作时，直接返回提示信息
    //   return ctx.helper.error({ ctx, errorType: WORK_NO_PERMISSION_FAIL })
    // }
    const payload = ctx.request.body
    // https://mongoosejs.com/docs/api/model.html#Model.findOneAndUpdate()
    // ? [options.new=false] «Boolean» if true, return the modified document rather than the original
    const res = await ctx.model.Work.findOneAndUpdate({ id }, payload, {
      // 默认返回值为本次修改之前的原记录，设置 new=true，表示返回本次更新后的最新数据
      new: true
    })
    return ctx.helper.success({ ctx, res, msg: '更新成功' })
  }
  @checkPermission('Work', WORK_NO_PERMISSION_FAIL)
  async delete() {
    const { ctx } = this
    const { id } = ctx.params
    // const hasPermission = await this.checkPermission(id)
    // if (!hasPermission) {
    //   // 没有权限执行当前操作时，直接返回提示信息
    //   return ctx.helper.error({ ctx, errorType: WORK_NO_PERMISSION_FAIL })
    // }
    // https://mongoosejs.com/docs/api/model.html#Model.findOneAndDelete()
    // ? [options.new=false] «Boolean» if true, return the modified document rather than the original
    // 返回被删除记录的 _id，id，title
    const res = await ctx.model.Work.findOneAndDelete({ id }).select(
      '_id id title'
    )
    return ctx.helper.success({ ctx, res, msg: '删除成功' })
  }
  @checkPermission('Work', WORK_NO_PERMISSION_FAIL, { action: 'publish' })
  async publish(isTemplate: boolean) {
    const { ctx, service } = this
    const url = await service.work.publish(ctx.params.id, isTemplate)
    ctx.helper.success({
      ctx,
      res: { url },
      msg: isTemplate ? '模板发布成功' : '作品发布成功'
    })
  }
  // 发布作品
  async publishWork() {
    await this.publish(false)
  }
  // 发布模板
  async publishTemplate() {
    await this.publish(true)
  }
}
