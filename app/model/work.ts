import { Application } from 'egg'
import { ObjectId } from 'mongoose'
// ! 注意：因为 mongoose-sequence 使用的是 CommonJS 规范，所以使用 ESModule 进行默认导入时，需要使用：import * as xxx from 'commonjs-lib'
// import * as AutoIncrementFactory from 'mongoose-sequence'
// 似乎在最新的更新中，可以直接导入
import AutoIncrementFactory from 'mongoose-sequence'

interface ChannelProps {
  name: string
  // work 的 uuid 字段
  id: string
}
export interface WorkProps {
  id?: number
  uuid: string
  title: string
  desc: string
  author: string
  // 被复制次数
  copiedCount: number
  user: ObjectId
  // 背景图片
  coverImg?: string
  content?: { [key: string]: any }
  // 是否为模板
  isTemplate?: boolean
  // 是否已经发布
  isPublic?: boolean
  isHot?: boolean
  // 作品状态：0-删除，1-未发布，2-发布，3-管理员强制下线
  status?: 0 | 1 | 2
  // 最新发布时间
  latestPublishAt?: Date
  // 展示渠道
  channels?: ChannelProps[]
}

const initWorkModel = (app: Application) => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const AutoIncrement = AutoIncrementFactory(mongoose)
  const WorkSchema = new Schema<WorkProps>(
    {
      // ? 在给字段赋值时，如果类型不匹配，会自动进行类型转换
      uuid: { type: String, unique: true },
      title: { type: String, required: true },
      desc: { type: String },
      coverImg: { type: String },
      content: { type: Object },
      isTemplate: { type: Boolean },
      isPublic: { type: Boolean },
      isHot: { type: Boolean },
      author: { type: String, required: true },
      copiedCount: { type: Number, default: 0 },
      // 作品状态：0-删除，1-未发布，2-发布，3-管理员强制下线
      status: { type: Number, default: 1 },
      //
      user: {
        type: Schema.Types.ObjectId,
        // 指定引用的 Collection（类似于 sql 中的外键字段）
        // ? sql 中的概念，一个表的外键字段必须是另一个表的主键字段
        // ? 一个表可以有多个外键，但是只能存在一个主键
        ref: 'User'
      },
      channels: { type: Array },
      // 最新发布时间
      latestPublishAt: { type: Date }
    },
    {
      // https://mongoosejs.com/docs/guide.html#timestamps
      // 在操作时，自动为 createdAt 和 updatedAt 字段赋值
      timestamps: true
    }
  )
  // https://www.npmjs.com/package/mongoose-sequence#global-sequences
  // https://www.npmjs.com/package/mongoose-sequence#options
  // ? mongoose-sequence 实现原理: 会在数据库中创建一个 counters 集合, 集合中有一条记录
  // 该记录中的有两个比较重要的字段: seq 和 id
  // seq: 记录中当前集合中最新一条新增数据的 id 值(自增字段), 也就是记录着最新的自增数值
  // id: 就是下面设置的 id 配置项值
  // 应该是在插入一条数据时, 首先根据 id 从 counters 集合中查询到对应的记录, 然后取出其 seq 值, 然后将新增数据的 id 字段值设置为 seq + 1, 让 counters 集合中对应记录的 seq 自增 1, 最后再将新数据插入集合
  WorkSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'works_id_counter' })
  return mongoose.model<WorkProps>('Work', WorkSchema)
}

export default initWorkModel
