import type { AxiosInstance } from 'axios'
import { Application } from 'egg'
import axios from 'axios'
// 阿里云短信服务
import Dysmsapi from '@alicloud/dysmsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client'

const AXIOS = Symbol('Application#axios')
const ALICLIENT = Symbol('Application#ALClient')

// https://www.eggjs.org/zh-CN/basics/extend#application
export default {
  // 方式1：通过 参数1 显式指定 this 的类型
  // echo(this: InstanceType<typeof Application>, msg: string) {
  echo(msg: string) {
    // 方式2：使用类型断言
    const that = this as Application
    // this.config.name 就是当前项目名称 lego-backend
    return `hello ${msg} ${that.config.name}`
  },
  get axiosInstance(): AxiosInstance {
    if (!this[AXIOS]) {
      this[AXIOS] = axios.create({
        baseURL: 'https://dog.ceo/',
        timeout: 5000
      })
    }
    return this[AXIOS]
  },
  // 阿里云短信服务
  get ALClient(): Dysmsapi {
    const that = this as Application
    const { accessKeyId, accessKeySecret, endpoint } =
      that.config.aliCloudConfig
    if (!this[ALICLIENT]) {
      const config = new $OpenApi.Config({
        // 必填，您的 AccessKey ID
        accessKeyId,
        // 必填，您的 AccessKey Secret
        accessKeySecret
      })
      // Endpoint 请参考 https://api.aliyun.com/product/Dysmsapi
      config.endpoint = endpoint
      this[ALICLIENT] = new Dysmsapi(config)
    }
    return this[ALICLIENT]
  }
}
