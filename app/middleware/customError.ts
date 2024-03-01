import { LOGIN_VALIDATE_FAIL } from '@/const/user'
import {
  IMAGE_UPALOD_FILE_SIZE_ERROR,
  IMAGE_UPLOAD_FILE_FORMAT_ERROR
} from '@/const/utils'
import { Context } from 'mocha'

export default () => {
  // 和 Koa 的中间件定义一样
  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      await next()
    } catch (e) {
      // 自定义相应给客户端的错误
      const error = e as any
      if (error && error.status === 401) {
        // ? 自定义 egg-jwt 的 token 验证失败时，抛出的 401 未授权异常返回信息
        return ctx.helper.error({ ctx, errorType: LOGIN_VALIDATE_FAIL })
      } else if (ctx.path === '/api/utils/upload-img') {
        // ? ctx.path 获取客户端请求的 url 路由路径
        // ? 自定义 egg-multipart 上传白名单(whitelist)之外文件格式时的响应信息
        if (error && error.status === 400) {
          return ctx.helper.error({
            ctx,
            errorType: IMAGE_UPLOAD_FILE_FORMAT_ERROR
          })
        } else if (error && error.status === 413) {
          // ? 自定义 egg-multipart 上传的文件大小达到设置的最大文件大小(fileSize)时的响应信息
          return ctx.helper.error({
            ctx,
            errorType: IMAGE_UPALOD_FILE_SIZE_ERROR
          })
        }
      }
      throw error
    }
  }
}
