#!/bin/bash
# 默认 shell 脚本发生错误时，还是会继续往后执行
# shell脚本中发生错误，即命令返回值不等于0，则停止执行并退出shell
set -e

# 在 Shell 中，我们通常将 EOF 与 << 结合使用，表示后续的输入作为子命令或子 Shell 的输入，直到遇到 EOF 为止，再返回主调 Shell。
mongo <<EOF
use admin
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')
use lego-backend
db.createUser({
  user:  '$MONGO_DB_USERNAME',
  pwd: '$MONGO_DB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: 'lego-backend'
  }]
})
db.createCollection('works')
db.works.insertMany([
  {
    id: 19,
    title: '1024 程序员日',
    desc: '1024 程序员日',
    author: '185****2625',
    coverImg: 'http://static-dev.imooc-lego.com/imooc-test/sZHlgv.png',
    copiedCount: 737,
    isHot: true,
    isTemplate: true,
    isPublic: true,
    createdAt: '2020-11-26T09:27:19.000Z',
  }
])
EOF

