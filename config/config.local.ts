import { EggAppConfig, PowerPartial } from 'egg'

// 在 development 模式下，会同时加载两个文件的配置
// config.default.ts 和 config.local.ts
// 两个文件的配置会合并，同时 config.local.ts 的同名配置优先级更高（会覆盖默认配置）
export default () => {
  const config: PowerPartial<EggAppConfig> = {}
  config.baseUrl = 'http://localhost:7001'
  return config
}
