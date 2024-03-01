import { Service } from 'egg'
import { createSSRApp } from 'vue'
import LegoComponents from 'lego-components'
import { renderToString } from 'vue/server-renderer'

// ? Vue SSR 渲染的两种方式
// const appContent = await renderToString(vueApp)
// https://www.eggjs.org/zh-CN/basics/extend#response
// * 方式一：设置返回内容的类型为一个 HTML 页面
// ctx.response.type = 'text/html'
// ctx.body = appContent
// * 方式二：设置返回内容的类型为一个 可读流
// const stream = renderToNodeStream(vueApp)
// ctx.status = 200
// pipe/pipeline 皆可
// ctx.req 是一个可读流
// ctx.res 是一个可写流
// await pipeline(stream, ctx.res)

export default class UtilsService extends Service {
  // 将 work 作品的 props 字段(对象)转换为对应的有效的 style 样式字符串
  propsToStyle(props = {}) {
    const keys = Object.keys(props)
    const styleArr = keys.map((key) => {
      // c 为匹配到的子串
      // fontSize => font-size
      const formatKey = key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
      // value 不需要进行转换
      const value = props[key]
      return `${formatKey}: ${value}`
    })
    return styleArr.join(';')
  }
  // 将传入数组 components 中所有 component 的 props 中的 css 样式单位 px 转换成对应的 vw
  px2vw(components: []) {
    const reg = /^(\d+(\.\d+)?)px$/
    components.forEach((component: any) => {
      const props = component.props || {}
      // 遍历对象的属性
      Object.keys(props).forEach((key) => {
        const value = props[key]
        // 不是字符串, 直接返回
        if (typeof value !== 'string') {
          return
        }
        // value 中没有 px, 说明不是一个距离的属性
        if (reg.test(value) === false) {
          return
        }
        // match 使用传入的 reg 正则表达式对 value 进行匹配, 返回结果为一个数组
        // 数组的第一项为 reg 匹配到的完整字符串
        // 第二项为第一个分组 () 内数据，第三项为第二个分组匹配到的数据，...，以此类推
        const arr = value.match(reg) || []
        const numStr = arr[1]
        const num = parseFloat(numStr)
        // 计算出 vw，重新赋值
        // ? 1vw = 1/100 视口宽度
        // 375 为页面设计稿的宽度，一般移动端的设计稿尺寸都是按照 iPhone6 的 375x667 进行设计的
        const vwNum = (num / 375) * 100
        // Number.prototype.toFixed(fractionDigits) 设置保留 number 的小数位数
        props[key] = `${vwNum.toFixed(2)}vw`
      })
    })
  }

  // 根据传入的查询条件获取对应的作品，然后返回该作品的 SSR 字符串以及 title，desc
  async renderToPageData(query: { id: string; uuid: string }) {
    // https://mongoosejs.com/docs/api/query.html#Query.prototype.lean()
    // 查询更快，返回的数据量更小，返回的 Document（一行记录）是一个纯 JS 对象
    // * 根据传入参数对象查询作品
    const work = await this.ctx.model.Work.findOne(query).lean()
    if (!work) {
      throw new Error('work not exist')
    }
    const { title, desc, content } = work
    // 调用 px2vw，即可实现将 content.components 中 component 的 props 中的 px 转换成对应的 vw 单位
    this.px2vw(content && content.components)
    // * 创建一个 SSR 应用，参数1 为根组件
    const vueApp = createSSRApp({
      data: () => ({ components: (content && content.components) || [] }),
      template: '<final-page :components="components"></final-page>'
    })
    // 以插件的方式安装 LegoComponents 组件库，其中提供了 final-page 等组件
    vueApp.use(LegoComponents)
    const html = await renderToString(vueApp)
    const bodyStyle = this.propsToStyle(content && content.props)
    return {
      html,
      title,
      desc,
      bodyStyle
    }
  }
}
