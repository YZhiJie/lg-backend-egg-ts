import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import { UserProps } from '@/model/user'
import { Document } from 'mongoose'

// https://casl.js.org/v6/en/guide/define-rules
// https://casl.js.org/v6/en/guide/restricting-fields
// userKey 参数为其他集合文档中保存 User 集合的 user._id 字段值的字段名称
export default function defineRoles(
  user: UserProps & Document<any, any, UserProps>,
  userKey = 'user'
) {
  const { can, rules } = new AbilityBuilder(createMongoAbility)
  switch (user.role) {
    case 'admin': {
      // https://casl.js.org/v6/en/guide/define-rules#ability-builder-class
      // manage 和 all 是关键字
      // manage 可以匹配所有 action
      // all 可以匹配所有 资源实体
      // ? 管理员可以读写所有资源
      can('manage', 'all')
      break
    }
    default:
      // ? can 方法参数说明：
      // 参数一：要执行的操作 action
      // 参数二：验证对象的父类的名称: user.constructor.name === 'User'
      // 参数三（可省）：可以操作的实体字段
      // 参数三/参数四：MongoQuery 查询条件
      // normal login user
      // ? users，只能读取自己的信息，以及更新特殊的字段
      can('update', 'User', ['nickname', 'picture'], { _id: user._id })
      can('read', 'User', { _id: user._id })
      // ? works，可以创建，可以更新和删除自己的 work
      can('create', 'Work', ['title', 'desc', 'content', 'coverImg'])
      can('delete', 'Work', { [userKey]: user._id })
      can('update', 'Work', ['title', 'desc', 'content', 'coverImg'], {
        [userKey]: user._id
      })
      can('read', 'Work', { [userKey]: user._id })
      // * 新增的 action
      can('publish', 'Work', { [userKey]: user._id })
      // ? channels，可以创建，可以更新和删除自己的 channel
      // channels 是 work 数据实例的一个字段，隶属于 work
      can('create', 'Channel', ['name', 'workId'], { [userKey]: user._id })
      can('delete', 'Channel', ['name'], { [userKey]: user._id })
      can('update', 'Channel', ['name'], { [userKey]: user._id })
      can('read', 'Channel', { [userKey]: user._id })
      break
  }
  return createMongoAbility(rules)
}
