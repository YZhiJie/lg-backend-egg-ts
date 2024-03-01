import 'egg'
import { Connection, Model } from 'mongoose'
import OSS, { Options } from 'ali-oss'

// ! 当前文件需要手动创建，用于编写一些自定义类型，不会被 egg 重写
// https://www.eggjs.org/zh-CN/tutorials/typescript#ts-类型定义typings

declare module 'egg' {
  // IModel 为 typings/app/model/index.d.ts 中自动生成的接口类型
  // 会自动动态生成所有 model 的类型声明
  // 所以，这里只需要继承 IModel，即可省实现 model 类型的自动声明
  interface MongooseModels extends IModel {
    [key: string]: Model<any>
  }

  // ctx
  interface Context {
    genHash(plainText: string): Promise<string>
    compare(plainText: string, hash: string): Promise<boolean>
    // egg-oss 插件会在 ctx 上添加一个 oss 字段，需要手动下面的添加 oss 的类型声明
    oss: OSS
  }

  // app.config
  interface EggAppConfig {
    bcrypt: {
      saltRounds: number
    }
    oss: {
      client?: Options
    }
  }

  // session
  interface Application {
    sessionMap: {
      [key: string]: any
    }
    // https://www.eggjs.org/zh-CN/core/cookie-and-session#扩展存储
    sessionStore: {
      get(key: string): Promise<string>
      set(key: string, value: any, maxAge?: number): Promise<any>
      destroy(key: string): Promise<any>
    }
  }

  // #region 手动添加类型声明

  // ! 注意：如果插件目录下的 index.d.ts 声明文件没有被加载，那么需要手动添加类型声明

  // ? egg-mongoose 插件目录下的 index.d.ts 已经包含下面的类型声明了
  // tip：可能是插件的加载时机导致的问题
  // app 对象为 Application 类型
  // interface Application {
  //   // 在 app 上扩展字段
  //   // createConnection() 的返回值类型
  //   mongoose: Connection
  //   model: MongooseModels
  // }
  // #endregion
}
