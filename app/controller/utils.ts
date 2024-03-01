import { IMAGE_UPLOAD_FAIL } from '@/const/utils'
import formatPath from '@/utils/formatPath'
import { Controller, FileStream } from 'egg'
import { nanoid } from 'nanoid'
import { createWriteStream } from 'node:fs'
import { parse, join, extname } from 'node:path'
// import { pipeline } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import sharp from 'sharp'
import sendToWormhole from 'stream-wormhole'
import busboy from 'busboy'

export default class UtilsController extends Controller {
  private THUMBNAIL_WIDTH: number = 300
  // 传入 str 的格式为：id-uuid
  // 以第一个 - 为分割标志位，分割字符串，返回 { id, uuid }
  splitIdAndUuid(str = '') {
    const result = { id: '', uuid: '' }
    if (!str) return result
    const firstDashIndex = str.indexOf('-')
    // const has = str.includes('-')
    if (firstDashIndex < 0) return result
    // slice(startIndex, endIndex) 返回 [startIndex, endIndex) 索引范围内的字符
    result.id = str.slice(0, firstDashIndex)
    // slice(startIndex) 返回从 startIndex 开始往后的所有字符
    result.uuid = str.slice(firstDashIndex + 1)
    return result
  }
  async renderH5Page() {
    const { ctx, service } = this
    const { idAndUuid } = ctx.params
    const query = this.splitIdAndUuid(idAndUuid)
    try {
      const pageData = await service.utils.renderToPageData(query)
      // https://www.eggjs.org/zh-CN/core/view#渲染页面
      // render a template, path related to `app/view`
      // 参数2 中的字段可以在参数1模板中通过 {{html}} 使用
      // ? 如果在环境变量中设置了 autoescaping（默认为 true），所有的输出都会自动转义，但可以使用 safe 过滤器，Nunjucks 就不会转义了
      // 示例-对内容如实输出：{{html}} => {{html | safe}}
      // 示例-对内容进行转义后输出：{{html}} => {{html | escape}}
      // https://mozilla.github.io/nunjucks/cn/templating.html#autoescaping
      await ctx.render('page.nj', pageData)
    } catch (e) {
      ctx.helper.error({ ctx, errorType: 'h5WorkNotExistError' })
    }
  }
  // ? 使用阿里云 OSS 存储桶实现文件上传
  async uploadToOSS() {
    const { ctx, app } = this
    // 获取接收上传文件的可读流对象
    const readUploadedFileStream = await ctx.getFileStream()
    // ? path.extname：获取路径中的文件扩展名
    // 上传到 lego-backend 存储桶下的 /imooc-test/**.ext
    const savedOSSPath = join(
      'imooc-test',
      nanoid(6) + extname(readUploadedFileStream.filename)
    )
    try {
      // 1. 存放的路径(包含文件名)：上传到存储桶下的路径
      // 注：在 config 中已经配置了 bucket
      // 2. file：要上传的文件（二进制数据）或者一个可读流对象
      const result = await ctx.oss.put(savedOSSPath, readUploadedFileStream)
      app.logger.info(result)
      const { name, url } = result
      ctx.helper.success({ ctx, res: { name, url } })
    } catch (e) {
      // 上传文件失败时，必须把 readUploadedFileStream 可读流给“消费”掉，否则就会卡死
      // https://www.npmjs.com/package/stream-wormhole
      // * ignore all error by default
      await sendToWormhole(readUploadedFileStream)
      // * throw error
      // sendToWormhole(readUploadedFileStream, true)
      //   .then(() => console.log('done'))
      //   .catch((err) => console.error(err))
      ctx.helper.error({ ctx, errorType: IMAGE_UPLOAD_FAIL })
    }
  }
  // ? 使用 File Mode 实现文件上传
  // https://www.eggjs.org/zh-CN/basics/controller#file-模式
  // ! 注意：下面这个方法要在 file 模式下运行，需要在 config.default.ts 中配置
  async fileLocalUpload() {
    const { ctx, app } = this
    // ? 知识补给：egg 内置了 egg-multipart 插件，用于处理文件上传
    // 上传的文件默认会被存放本机上的一个临时目录下（file.filepath）
    // ? 1. 处理单文件上传
    const { filepath } = ctx.request.files[0]
    // https://www.npmjs.com/package/sharp
    // * 生成 sharp 实例
    const imageSource = sharp(filepath)
    // 获取图片的元数据（包含宽高等信息）
    const metaData = await imageSource.metadata()
    app.logger.debug(metaData)
    let thumbnailUrl = ''
    // 图片宽度是否大于 300，才生成缩略图
    if (metaData.width && metaData.width > 300) {
      // generate a new file path
      // /uploads/**/abc.png => /uploads/**/abc-thumbnail.png
      // * thumbnail 为图片的宽高比（一般基于图片原尺寸进行等比例缩放）
      // ? path.parse(pathStr) 对传入的路径进行解析，解析后可得下面几部分：
      // root: 系统根目录（window下为盘符根路径）,
      // dir: '图片在本机的存放目录的绝对路径',
      // base: '带文件后缀的文件名',
      // ext: '文件后缀',
      // name: '不带文件后缀的文件名'
      const { name, ext, dir } = parse(filepath)
      app.logger.debug(name, ext, dir)
      const widthScaleRatio = this.THUMBNAIL_WIDTH / metaData.width
      let thumbnailHeight = 0
      if (metaData.height) {
        // 取整数：四舍五入
        thumbnailHeight = Math.round(metaData.height * widthScaleRatio)
      }
      // * 方式一：直接在原图片名称后添加 -thumbnail 表示其为缩略图
      // const thumbnailFilePath = join(dir, `${name}_thumbnail${ext}`)
      // * 方式二：显示缩略图的具体宽高比数值
      const thumbnailFilePath = join(
        dir,
        `${name}-${this.THUMBNAIL_WIDTH}x${thumbnailHeight}${ext}`
      )
      // 缩放图片尺寸：宽度 300，高度自适应
      // toFile(fileSavePath) 保存图片到入参路径下
      await imageSource
        .resize({ width: this.THUMBNAIL_WIDTH })
        .toFile(thumbnailFilePath)
      thumbnailUrl = this.pathToURL(thumbnailFilePath)
    }
    // app.config.baseDir 当前项目在本机上的绝对路径（windowOS带盘符）
    const url = this.pathToURL(filepath)
    return ctx.helper.success({
      ctx,
      res: { url, thumbnailUrl: thumbnailUrl ? thumbnailUrl : url }
    })

    // ? 使用 File Mode 如何实现将文件上传到阿里云 OSS 存储桶中
    // 1. get stream saved to local file
    // 2. file upload to OSS
    // 3. delete local file
    // ? 使用 Stream Mode 如何实现将文件上传到阿里云 OSS 存储桶中
    // 1. get stream
    // 2. upload stream to OSS
  }
  // 使用 Stream Mode 实现文件上传
  // https://www.eggjs.org/zh-CN/basics/controller#stream-模式
  async fileUploadByStream() {
    const { ctx, app } = this
    // * 1. 获取可读流（默认会读取上传的文件）
    // 注意: ctx.getFileStream() 只能获取到一个文件流, 是用于单文件上传
    // 如果需要获取多个文件流, 需要使用 ctx.multipart, 示例详见下面的 uploadMultipleFiles 方法
    const readStream = await ctx.getFileStream()
    // uploads/**.ext
    // uploads/xxx_thumbnail.ext
    const uid = nanoid(6)
    // ? stream.filename: 获取上传的文件名称
    // 原文件保存路径
    const savedFilePath = join(
      app.config.baseDir,
      'uploads',
      uid + extname(readStream.filename)
    )
    // 缩略图保存路径
    const savedThumbnailPath = join(
      app.config.baseDir,
      'uploads',
      uid + '_thumbnail' + extname(readStream.filename)
    )
    // * 2. 创建可写流
    const originalWriteStream = createWriteStream(savedFilePath)
    const thumbnailWriteStream = createWriteStream(savedThumbnailPath)
    // 创建保存文件的 Promise
    // const saveOriginalPromise = new Promise((resolve, reject) => {
    //   // readStream
    //   // ? 每使用一次 pipe，都要对其进行错误处理，不然当出错时，程序就会崩溃
    //   // * 就是为每一步操作都进行错误处理
    //   // * 解决方法：使用 pipeline 方法进行包裹
    //   // https://nodejs.cn/api/stream/stream_pipeline_streams_callback.html
    //   // readStream.
    //   // createReadStream('./fake.txt')
    //   //   .pipe(originalWriteStream)
    //   //   .on('finish', resolve)
    //   //   .on('error', reject)
    //   // ? pipeline：用于在流和生成器之间进行管道转发错误并正确清理并在管道完成时提供回调
    //   // pipeline(readStream, originalWriteStream, (err) => {
    //   //   if (err) {
    //   //     reject(err)
    //   //   }
    //   //   resolve('success')
    //   // })
    // })
    // ? pipeline Promise 版本
    // 注意：该 api 在 v15.0.0 版本中才加入的，另外 @types/node 的版本也要匹配上
    // * pipeline：用于在流和生成器之间进行管道转发错误并正确清理并在管道完成时提供回调
    // https://nodejs.cn/api/stream.html#streampipelinesource-transforms-destination-options
    const saveOriginalPromise = pipeline(readStream, originalWriteStream)

    // 转换流
    const transformer = sharp().resize({ width: this.THUMBNAIL_WIDTH })
    // 保存缩略图
    // const saveThumbnailPromise = new Promise((resolve, reject) => {
    //   // ? 每使用一次 pipe，都要对其进行错误处理，不然当出错时，程序就会崩溃
    //   // * 就是为每一步操作都进行错误处理
    //   // * 解决方法：使用 pipeline 方法进行包裹
    //   // https://nodejs.cn/api/stream/stream_pipeline_streams_callback.html
    //   // readStream
    //   //   .pipe(transformer)
    //   //   .pipe(thumbnailWriteStream)
    //   //   .on('finish', resolve)
    //   //   .on('error', reject)
    //   // ? pipeline：用于在流和生成器之间进行管道转发错误并正确清理并在管道完成时提供回调
    //   pipeline(readStream, transformer, thumbnailWriteStream, (err) => {
    //     if (err) {
    //       reject(err)
    //     }
    //     resolve('success')
    //   })
    // })
    // ? pipeline Promise 版本
    // 注意：该 api 在 v15.0.0 版本中才加入的，另外 @types/node 的版本也要匹配上
    // * pipeline：用于在流和生成器之间进行管道转发错误并正确清理并在管道完成时提供回调
    // https://nodejs.cn/api/stream.html#streampipelinesource-transforms-destination-options
    const saveThumbnailPromise = pipeline(
      readStream,
      transformer,
      thumbnailWriteStream
    )
    try {
      // Promise.all([]) 等待传入数组中所有的 Promise 返回结果
      await Promise.all([saveOriginalPromise, saveThumbnailPromise])
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: IMAGE_UPLOAD_FAIL })
    }

    ctx.helper.success({
      ctx,
      res: {
        url: this.pathToURL(savedFilePath),
        thumbnailUrl: this.pathToURL(savedThumbnailPath)
      }
    })
  }
  // https://www.eggjs.org/zh-CN/basics/controller#stream-模式
  async uploadMultipleFilesToOSS() {
    const { ctx, app } = this
    // https://github.com/mscdex/busboy?tab=readme-ov-file#exports
    // egg-multipart 底层是基于 busboy 实现的，而 busboy 只导出了一个函数
    // ? 这里的 multipart 的 options 配置就是 busboy 唯一导出的函数的参数对象
    // 这里接收到的是 app.config.multipart.fileSize 对应的字节数(内部会进行转换)
    // 所以, 这里的 fileSize 为数值类型
    // const { fileSize } = app.config
    const parts = ctx.multipart({
      // 一些限制条件
      // limits: {
      //   // 限制上传的文件大小必须 <= fileSize
      //   fileSize: fileSize as number
      // }
    })
    // 最后返回一个数组：urls = [xxx, xxx]
    const urls: string[] = []
    let part: FileStream | string[]
    // ? 每调用一次 parts()，它就会返回下一个表单数据
    // * 内部使用的生成器，然后就可以实现逐个获取了
    // 文本数据为一个数组
    // 文件数据为一个 FileStream 对象
    while ((part = await parts())) {
      // * part 为文本类型
      if (Array.isArray(part)) {
        app.logger.info(part)
      } else {
        try {
          // #region 自定义监听 fileSize
          // https://github.com/mscdex/busboy?tab=readme-ov-file#special-parser-stream-events
          // ? 当上传的文件大小达到设置的最大文件大小 fileSize 时, part 上的 truncated 属性会被设置为 true, 同时会发出一个 limit 事件
          // ! 目前 egg-multipart 已经在 multipart 方法中处理了 fileSize 的限制问题
          // ! 也是通过 part.truncated 和监听 limit 事件
          // 源码实现详见下面链接文件第 91 行
          // https://github.com/eggjs/egg-multipart/blob/master/app/extend/context.js
          // if (part.truncated) {
          //   return ctx.helper.error({
          //     ctx,
          //     errorType: IMAGE_UPALOD_FILE_SIZE_ERROR,
          //     error: `Reach fileSize limit ${fileSize} bytes`
          //   })
          // }
          // #endregion
          // * part 为文件类型
          // ? stream.filename: 获取上传的文件名称
          // 原文件保存路径
          const savedFilePath = join(
            'imooc-test',
            nanoid(6) + extname(part.filename)
          )
          const result = await ctx.oss.put(savedFilePath, part)
          // 删除存储桶中的 savedFilePath 文件
          // await ctx.oss.delete(savedFilePath)
          const { url } = result
          urls.push(url)
        } catch (e) {
          // “消费”掉文件流，避免进程被卡死
          await sendToWormhole(part)
          ctx.helper.error({
            ctx,
            errorType: IMAGE_UPLOAD_FAIL
          })
        }
      }
    }
    ctx.helper.success({ ctx, res: { urls }, msg: '上传成功' })
  }
  // 使用 busboy 上传文件(可以上传多个文件)
  async uploadFileUseBusboy() {
    const { ctx, app } = this
    return new Promise<string[]>((resolve) => {
      // ? req 是 Node.js 的原始对象，request 是经过 Egg 处理后的对象
      // https://www.npmjs.com/package/busboy?activeTab=readme#examples
      const bb = busboy({
        // https://www.eggjs.org/zh-CN/basics/controller#header
        // https://eggjs.github.io/zh/guide/context.html#ctx-get-name
        headers: ctx.req.headers
      })
      const results: string[] = []
      // ? 解析文件数据
      bb.on('file', (fieldname, file, info) => {
        app.logger.info(fieldname, file, info)
        const uid = nanoid(6)
        const savedFilePath = join(
          app.config.baseDir,
          'uploads',
          uid + extname(info.filename)
        )
        // file 是一个可读流（读取客户端上传的文件数据）
        // 将 file 读取到的文件数据写出到 savedFilePath 文件中
        file.pipe(createWriteStream(savedFilePath))
        // https://nodejs.cn/api/stream.html
        file.on('end', () => {
          const fileLink = this.pathToURL(savedFilePath)
          results.push(fileLink)
        })
      })
      // ? 解析文本数据
      bb.on('field', (fieldname, val, info) => {
        app.logger.info(fieldname, val, info)
      })
      // ? 解析完成
      bb.on('finish', () => {
        app.logger.info('finished')
        resolve(results)
      })
      // req 是 Node.js 的原始对象, request 是经过 Egg 处理后的对象
      // 将 Node.js 接收到的请求数据转交给 busboy 处理
      ctx.req.pipe(bb)
    })
  }
  // 测试 busboy 上传文件
  async testBusboy() {
    const { ctx } = this
    const results = await this.uploadFileUseBusboy()
    ctx.helper.success({ ctx, res: results })
  }
  // 将文件路径转换为对应可以在浏览器访问的 URL（静态资源 URL）
  pathToURL(p: string) {
    const {
      app: { config }
    } = this
    return formatPath(p.replace(config.baseDir, config.baseUrl))
  }
}
