// 默认，在当前 ts 项目中，只能使用 ESModule 规范语法进行导包
// ? 使用 /* eslint-disable rule1, rule2, ... */ 来禁用当前文件内生效的 eslint 对应的规则
/* eslint-disable @typescript-eslint/no-var-requires, no-restricted-modules */
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const buildFileDest = path.resolve(__dirname, '../app/public')
const templateFileDest = path.resolve(__dirname, '../app/view')

// ? webpack 命令行 环境配置 的 --env 参数，可以允许你传入任意数量的环境变量。
// 而在 webpack.config.js 中可以访问到这些环境变量。
// 示例：npx webpack --env goal=local --env production --progress
// https://www.webpackjs.com/guides/environment-variables/
module.exports = (env) => {
  return {
    mode: 'production',
    // https://www.webpackjs.com/configuration/entry-context/#context
    // 默认使用 Node.js 进程的当前工作目录，但是推荐在配置中传入一个值
    // 这使得你的配置独立于 CWD(current working directory, 当前工作目录)
    context: path.resolve(__dirname, '../webpack'),
    entry: './index.js',
    output: {
      path: buildFileDest,
      // https://github.com/webpack/loader-utils/#interpolatename
      // hash：根据文件内容生成对应的 hash 值
      filename: 'bundle-[hash].js',
      // 就是在打包后的模板文件中引入当前 bundle 时，加上下面设置的 publicPath 公共路径前缀
      // 生产模式下就使用 OSS 线上地址, 开发模式下就使用本地的 public 静态资源共享目录
      publicPath: env.production
        ? 'http://lego-backend.oss-cn-shanghai.aliyuncs.com/h5-assets/'
        : '/public/'
      // ? 下次构建时，先清空构建目录下的原有文件
      // 作用类似于 clean-webpack-plugin
      // clean: true
    },
    module: {
      // ? webpack 默认会处理 .js 文件
      rules: [
        {
          test: /\.css$/,
          // ? loader 的执行顺序是从后往前的
          // 即，会先使用 css-loader 解析文件中的 css 样式，然后再使用 MiniCssExtractPlugin.loader 将 css-loader 解析的 css 样式提取到一个单独的文件中
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        // https://github.com/webpack/loader-utils/#interpolatename
        // hash：根据文件内容生成对应的 hash 值
        // name：bundle 的名称
        // ? 设置保存 css 的文件名称
        filename: '[name].[hash].css'
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './template.html'),
        filename: 'page.nj'
      }),
      // https://www.npmjs.com/package/filemanager-webpack-plugin
      // This Webpack plugin allows you to copy, archive (.zip/.tar/.tar.gz), move, delete files and directories before and after builds
      new FileManagerPlugin({
        events: {
          // ? 在 webpack 构建完成之后再执行
          onEnd: {
            // ? 复制文件
            copy: [
              {
                // 源文件路径
                source: path.join(buildFileDest, 'page.nj'),
                // 复制文件的保存路径
                destination: path.resolve(templateFileDest, 'page.nj')
              }
            ]
          }
        }
      }),
      // https://www.npmjs.com/package/clean-webpack-plugin
      new CleanWebpackPlugin()
    ]
  }
}
