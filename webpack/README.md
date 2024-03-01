- template.html 中的 `{{}}` 语法报错不用理会，只要 webpack 可以正常打包即可。
  因为 `template.html` 最终会被 webpack 打包成 `page.nj`，`.nj` 文件中可以编写 `nunjucks` 模板语法， 而 `{{}}` 正是 `nunjucks` 的插值语法。

- webpack 配置环境变量：https://www.webpackjs.com/guides/environment-variables/
