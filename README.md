# tegg app

[Hacker News](https://news.ycombinator.com/) showcase using [tegg](https://github.com/eggjs/tegg)

## QuickStart

### Development

```bash
# 需要在 mongoDB 中创建一个数据库：lego-backend
npm i
npm run dev
open http://localhost:7001/
```

Don't tsc compile at development mode, if you had run `tsc` then you need to `npm run clean` before `npm run dev`.

### Deploy

```bash
npm run tsc
npm start
```

### Npm Scripts

- Use `npm run lint` to check code style
- Use `npm test` to run unit test
- se `npm run clean` to clean compiled js at development mode once

### Requirement

- Node.js >= 16.x
- Typescript >= 4.x

## Problems

- warning：EggContextLogger is deprecated
- https://github.com/eggjs/egg/issues/5213

  修复: use `app.logger` instead of `ctx.logger`

## Note

- 可以直接删除的文件
  - run 目录下的都是运行时产生的文件
  - logs 目录下的文件和根目录下的 log.txt 都是运行时产生的记录文件
- 当前项目只能使用支持 CommonJS 规范的第三方依赖包

## 项目重构

- 一般来说，都是随着项目的复杂度逐步升高，达到一定的程度时，才会考虑项目代码重构的问题
  重构点示例：对项目代码进行分类
  1. 整合所有的类型到一个文件夹中管理，该文件夹下可以有多个文件，分别对应着一个或者多个模块
  2. 整合所有的常量到一个文件夹中管理，（跟上面一样）
  3. 抽取通用代码，比如抽取一段业务代码为一个单独的工具函数，使用时直接调用该函数即可

## 静态资源共享目录

- [静态资源](https://www.eggjs.org/zh-CN/intro/quickstart#静态资源)
- `public` 共享目录下的静态文件，如 js, css, img 等可以上传到阿里云 OSS 存储桶或者 CDN 服务器中，以便缩减静态资源请求时间。

当前目录下的文件可以通过 `项目运行地址/public/文件名` 的方式进行访问。

## 生成 package.json
在当前项目中
- `cnpm install` 没有生成 `package-lock.json`
- `npm install` 会生成 `package-lock.json`
  ```bash
  # 使用淘宝源安装
  npm i --registry=https://registry.npmmirror.com
  ```

## package.json 常用脚本命令说明

- "tsc": "tsc",
- "clean": "tsc -b --clean",
- "start": "egg-scripts start --daemon --title=egg-server-lego-backend",
- "stop": "egg-scripts stop --title=egg-server-lego-backend",
  先执行 `npm run tsc` 编译项目, 将 ts 文件编译成对应 js 文件, 然后执行 `npm run start` 即可运行编译后的 js 文件, 这时系统后台会启动一个进程运行该服务
  可以通过执行 `npm run stop` 停止该服务进程, 可以执行 `npm run clean` 清理 `npm run tsc` 时生成的 js 文件
- "dev": "egg-bin dev",
  启动一个开发服务器, 具备热更新功能, 可以边开发边调试
- "debug": "egg-bin debug",
  以调试模式运行项目
- "test:local": "egg-bin test -p",
- "test": "npm run lint -- --fix && npm run test:local",
  使用 eslint 检查语法并自动修复错误, 同时启动测试实例
- "lint": "eslint . --ext .ts --cache --fix",
  使用 eslint 检查语法
- "format": "prettier --write .",
  使用 prettier 美化代码格式
- "remove": "rm -rf run logs node_modules && rm log.txt",
  移除一些不需要的文件
- "build:template:dev": "webpack --config ./webpack/webpack.config.js",
  构建 page.nj 模板文件及其所需静态资源文件到 `public` 目录下, 将 publicPath 为 `public` 目录
- "build:template:prod": "webpack --config ./webpack/webpack.config.js --env production && npm run uploadPublicFileToOSS",
  构建 page.nj 模板文件及其所需静态资源文件到 `public` 目录下, **将 publicPath 为阿里云 OSS 线上地址, 将 `public` 目录下的静态资源文件上传到阿里云 OSS 存储桶中**
- "uploadPublicFileToOSS": "node ./webpack/uploadToOSS.js"
  上传 `public` 目录下的静态资源文件到阿里云 OSS 存储桶中
