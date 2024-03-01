import path from 'node:path'

/**
 * 确保路径中的分隔符为 /
 * 作用：处理 Mac 和 Window 之间的路径分隔符的兼容
 * @param p 路径字符串
 * @return {string} 兼容的路径字符串
 */
export default function formatPath(p: string): string {
  if (p && typeof p === 'string') {
    const sep = path.sep
    if (sep === '/') {
      // Mac
      return p
    }
    // 将路径中的 \ 全部替换为 /
    return p.replace(/\\/g, '/')
  }
  return p
}
