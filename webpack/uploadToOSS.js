// 默认，在当前 ts 项目中，只能使用 ESModule 规范语法进行导包
// ? 使用 /* eslint-disable rule1, rule2, ... */ 来禁用当前文件内生效的 eslint 对应的规则
/* eslint-disable @typescript-eslint/no-var-requires, no-restricted-modules */
const OSS = require('ali-oss')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// ? 设置环境变量
// 注意：当省略参数时，dotenv 默认会解析当前目录下的 .env 文件
// 但是，当前处于 webpack 目录下，而不是根目录，所以需要手动配置 .env 文件的路径
dotenv.config({
  // path 的默认值为 process.cwd()，一般都是根目录
  // 就是执行 npm run dev 时所处的目录路径
  path: path.resolve(__dirname, '../.env')
})
const publicPath = path.resolve(__dirname, '../app/public')
// * 创建 OSS 连接
const client = new OSS({
  accessKeyId: process.env.ALI_ACCCESS_KEY || '',
  accessKeySecret: process.env.ALI_ACCCESS_KEY_SECRET || '',
  // 阿里云 OSS 存储桶名称
  bucket: 'lego-backend',
  // https://help.aliyun.com/zh/oss/user-guide/regions-and-endpoints
  // 在存储桶详情页面 > **概览** > **访问端口** > **外网访问** 行中的 >  Endpoint（地域节点）
  // 注：不同地域的域名也会不一样，下面是上海的 EndPoint
  endpoint: 'oss-cn-shanghai.aliyuncs.com'
})

async function run() {
  // ? 获取指定文件夹下的所有文件的名称列表
  const publicFiles = fs.readdirSync(publicPath)
  // 过滤掉 public 目录下不需要上传到 OSS 的文件
  const files = publicFiles.filter((f) => f !== 'page.nj')
  const urls = await Promise.all(
    files.map(async (fileName) => {
      const savedOSSPath = path.join('h5-assets', fileName)
      const filePath = path.join(publicPath, fileName)
      // 将 filePath 文件上传到 OSS 存储桶的 savedOSSPath
      const result = await client.put(savedOSSPath, filePath)
      const { url } = result
      return url
    })
  )
  console.log('上传成功：', urls)
}
run()
