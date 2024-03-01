import { Controller, IModel } from 'egg'
import { GlobalErrorTypes } from '@/error'
import defineRoles from '@/roles'
import { subject } from '@casl/ability'
import { permittedFieldsOf } from '@casl/ability/extra'
// lodash/fp 中定义的应该都是纯函数，不会修改传入的参数的值
import { difference, assign } from 'lodash/fp'

// Record<K, V> 指定一个对象的 key 的类型为 T，value 的类型为 V
// ? 将 RESTful API 的请求方法名和 casl 的 action 名称建立映射
const caslMethodMapping: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  DELETE: 'delete'
}
interface ModelMapping {
  // mongoose 中定义的名称
  mongoose: string
  // casl 中定义的名称
  casl: string
}
interface IOptions {
  // 自定义 action
  action?: string
  // 查找记录时的 key，默认为 id
  key?: string
  // 查找记录时 value 的 来源 默认为 ctx.params
  // 来源于对应的 URL 动态路由参数 或者 ctx.request.body，valueKey 数据来源的键值
  value?: { type: 'params' | 'body'; valueKey: string }
}
const defaultSearchOptions = {
  key: 'id',
  value: { type: 'params', valueKey: 'id' }
}
// permittedFieldsOf 方法的参数4 options 配置项
const fieldOptions = {
  // 这里的 rule 就是 ability.relevantRuleFor(action, modelName) 的返回值
  fieldsFrom: (rule: any) => rule.fields || []
}

// { id: ctx.params.id }
// ? channels 字段操作的过滤条件
// { "channels.id": ctx.params.id }
// { "channels.id": ctx.request.body.workId }

// ? 验证当前用户对于名为 modelName 的 Model 是否具有操作权限
// * 具有操作权限的条件：操作的记录要存在，且该记录的 user 字段等于当前用户的 _id
// userKey 就是当前 model 中的记录其所属的 user 的 _id 的字段名
// 传入参数3 options.action，可以自定义 casl 的 action 名称
// 注：默认是根据客户端请求的类型（ctx.request.method）自动映射为对应的 action 名称
/**
 *
 * @param modelName model 的名称，可以是普通的字符串，也可以是 casl 和 mongoose 的映射关系
 * @param errorType 返回的错误类型，来自 GlobalErrorTypes
 * @param options 特殊配置选项，可以自定义 action 以及查询条件，详见上面的 IOptions 选项
 * @return {any} 装饰器 function
 */
export default function checkPermission(
  modelName: keyof IModel | ModelMapping,
  errorType: GlobalErrorTypes,
  options?: IOptions
) {
  // ? 参数1可以设置 this 的类型
  // 在编译时会被抹除，所以函数的第一个形参实际上是从第二个位置开始
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    descriptor.value = async function (this: Controller, ...args: any[]) {
      const { ctx } = this
      // const { id } = ctx.params
      // 获取客户端发送的请求类型
      const { method } = ctx.request
      // 类似于 Object.assign，但是下面的 assign 不会修改传入的实参，而是会生成一个新对象返回
      // 就是使用 options 中的同名字段覆盖默认值
      const searchOptions = assign(defaultSearchOptions, options || {})
      const {
        key,
        value: { type, valueKey }
      } = searchOptions

      // ? channels 字段操作的过滤条件
      // { "channels.id": ctx.params.id }
      // { "channels.id": ctx.request.body.workId }
      // ? 构建一个 query
      const source = type === 'params' ? ctx.params : ctx.request.body
      const query = {
        [key]: source[valueKey]
      }
      // ? 构建 modelName
      // mongooseModelName 用于 mongoose 操作，caslName 用于 casl 权限认证操作
      const mongooseModelName =
        typeof modelName === 'string' ? modelName : modelName.mongoose
      const caslModelName =
        typeof modelName === 'string' ? modelName : modelName.casl
      // 根据客户端发送的请求类型获取对应的 CASL 权限控制 action 名称
      const action =
        options && options.action ? options.action : caslMethodMapping[method]
      if (!ctx.state && !ctx.state.user) {
        // 用户没有登录
        return ctx.helper.error({ ctx, errorType })
      }
      let permission = false
      let keyPermission = true
      // 获取定义的 roles
      const ability = defineRoles(ctx.state.user)
      // 获取某个验证规则，判断是否有设置查询条件
      const rule = ability.relevantRuleFor(action, caslModelName)
      console.log('🚀 ~ rule:', rule)
      if (rule && rule.conditions) {
        // * 有查询条件时，先从根据查询条件，数据库中获取数据，然后将查询到的数据作为当前权限认证的数据源
        const certainRecord = await ctx.model[mongooseModelName].findOne(query)
        // ? subject(modelName, certainRecord) 返回一个 Subject 实体，可以用于 can 等方法的参数2（认证数据源）
        // subject 方法的参数1需要和定义当前规定时设置的参数2 subjectName 保持一致
        permission = ability.can(action, subject(caslModelName, certainRecord))
      } else {
        // * 没有过滤条件时，进行整体认证（对 modelName 模块）
        permission = ability.can(action, caslModelName)
      }
      // ? 判断 rule 中是否有对应的受限字段 fileds（允许操作的字段）
      if (rule && rule.fields) {
        const fields = permittedFieldsOf(
          ability,
          action,
          caslModelName,
          fieldOptions
        )
        if (fields.length > 0) {
          // ? 1. 过滤 ctx.request.body（本次不采用）
          // ? 2. 获取当前的 payload 的 keys 和允许的 fields 作比较
          // fields 对 payloadKeys 的关系应该是全部包含的关系
          const payloadKeys = Object.keys(ctx.request.body)
          // difference：参数1必须被包含于参数2数组中，作为参数2的子集
          const diffKeys = difference(payloadKeys, fields)
          console.log('🚀 ~ payloadKeys, fields:', payloadKeys, fields)
          console.log('🚀 ~ diffKeys:', diffKeys)
          // ? 合法条件：ctx.request.body 的 keys 必须被包含于 rule 中允许操作的 fields
          // 也就是不允许传递非法的 key
          keyPermission = diffKeys.length === 0
        }
      }
      if (!permission || !keyPermission) {
        return ctx.helper.error({ ctx, errorType })
      }
      // 完成上面的扩展功能后，执行被装饰的函数
      await originalMethod.apply(this, args)
    }
  }
}
