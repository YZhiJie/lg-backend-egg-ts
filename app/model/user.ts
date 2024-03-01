// https://www.eggjs.org/zh-CN/advanced/loader#loadtoapp
// ? loadToApp 有三个参数：loadToApp(directory, property, LoaderOptions)
// * 此函数用来将一个目录下的文件加载到 app 对象上，例如 app/model/user.js 会被加载到 app.model.user
// * app.model.user = app/model/user.js 默认导出函数的执行结果
// directory 可以是字符串或数组。Loader 会从这些目录中加载文件。
// property 是 app 的属性名。
// LoaderOptions 包含了一些配置选项。

import { Application } from 'egg'
import { Schema } from 'mongoose'
// ! 注意：因为 mongoose-sequence 使用的是 CommonJS 规范，所以使用 ESModule 进行默认导入时，需要使用：import * as xxx from 'commonjs-lib'
// import * as AutoIncrementFactory from 'mongoose-sequence'
// 似乎在最新的更新中，可以直接导入
import AutoIncrementFactory from 'mongoose-sequence'

export interface UserProps {
  // 用户名
  username: string
  // 密码
  password: string
  // 邮箱（可选）
  email?: string
  // 昵称（可选）
  nickname?: string
  // 用户头像（可选）
  picture?: string
  // 手机号码（可选）
  phoneNumber?: string
  // 创建时间
  createdAt: Date
  // 更新时间
  updatedAt: Date
  // 帐号类型：可以通过邮箱、手机号码、oauth授权 三种方式
  type: 'email' | 'cellphone' | 'oauth'
  // oauth 授权提供商
  provider?: 'gitee'
  // oauth id
  oauthID?: string
  // 用户角色
  role?: 'admin' | 'normal'
}

// loadToApp 加载当前文件时，如果默认导出为一个函数，则会加载的时候会注入一个 app 实参
function initUserModel(app: Application) {
  // https://www.npmjs.com/package/mongoose-sequence
  const AutoIncrement = AutoIncrementFactory(app.mongoose)

  const UserSchema = new Schema<UserProps>(
    {
      // ? 在给字段赋值时，如果类型不匹配，会自动进行类型转换
      // https://mongoosejs.com/docs/guide.html
      // https://mongoosejs.com/docs/api/schematypeoptions.html
      username: {
        // 数据类型
        type: String,
        // 值唯一：创建一个索引
        unique: true,
        // 必选
        required: true
      },
      // 使用手机号码登录时不需要输入密码，只需要输入验证码
      password: { type: String },
      email: { type: String },
      nickname: { type: String },
      picture: { type: String },
      phoneNumber: { type: String },
      type: {
        // 字段类型
        type: String,
        // 默认值
        default: 'email'
      },
      provider: { tyype: String },
      oauthID: { tyype: String },
      role: { type: String, default: 'normal' }
    },
    {
      // https://mongoosejs.com/docs/guide.html#timestamps
      // 在操作时，自动为 createdAt 和 updatedAt 字段赋值
      timestamps: true,
      // https://mongoosejs.com/docs/guide.html#toJSON
      // ? 就是设置调用 toJson 方法时，返回的数据
      toJSON: {
        transform(_doc, ret) {
          // js 语法：移除对象 ret 上的字段 password 和 __v
          delete ret.password
          delete ret.__v
          // ? return 是可省的
          // 原因是 ret 是一个引用数据类型，当没有 return 时，默认返回 ret 对象
          // return ret
        }
      }
    }
  )
  // https://www.npmjs.com/package/mongoose-sequence#global-sequences
  // https://www.npmjs.com/package/mongoose-sequence#options
  // ? mongoose-sequence 实现原理: 会在数据库中创建一个 counters 集合, 集合中有一条记录
  // 该记录中的有两个比较重要的字段: seq 和 id
  // seq: 记录中当前集合中最新一条新增数据的 id 值(自增字段), 也就是记录着最新的自增数值
  // id: 就是下面设置的 id 配置项值
  // 应该是在插入一条数据时, 首先根据 id 从 counters 集合中查询到对应的记录, 然后取出其 seq 值, 然后将新增数据的 id 字段值设置为 seq + 1, 让 counters 集合中对应记录的 seq 自增 1, 最后再将新数据插入集合
  UserSchema.plugin(AutoIncrement, {
    // ? 设置自增的字段名称
    // 就是在 users 集合的 document 中新增一个自增的字段 id（从 1 开始）
    inc_field: 'id',
    // 为当前 sequence 设置一个唯一标识
    id: 'users-id-counter'
  })
  // 返回 UserModel
  // ? 对应集合名称：users
  // 即，model 的参数1 变小写，再变复数
  return app.mongoose.model<UserProps>('User', UserSchema)
}

export default initUserModel
