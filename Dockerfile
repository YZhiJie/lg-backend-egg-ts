# 从上到下逐行执行，前一行是后一行的基础
FROM node:20-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# 将 package.json package-lock.json 复制到 /usr/src/app/
COPY package.json package-lock.json /usr/src/app/
# 优化构建速度：将 COPY . /usr/src/app 放到 npm install 之后，则当文件内容变化后，不会重新安装依赖，而是会直接使用之前缓存的，这样就可以节省 npm install 安装依赖的时间
RUN npm install
COPY . /usr/src/app
RUN npm run tsc
RUN npm run build:template:prod
RUN npm run upload
EXPOSE 7001
CMD npx egg-scripts start --title=lego-backend
