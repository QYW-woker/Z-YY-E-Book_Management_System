import dayjs from 'dayjs'

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot + 1).toLowerCase()
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as unknown as T
  if (obj instanceof Object) {
    const copy = {} as T
    Object.keys(obj).forEach((key) => {
      (copy as any)[key] = deepClone((obj as any)[key])
    })
    return copy
  }
  return obj
}

/**
 * 将树形结构扁平化
 */
export function flattenTree<T extends { children?: T[] }>(
  tree: T[],
  childrenKey = 'children'
): Omit<T, 'children'>[] {
  const result: Omit<T, 'children'>[] = []
  const traverse = (nodes: T[]) => {
    nodes.forEach((node) => {
      const { [childrenKey]: children, ...rest } = node as any
      result.push(rest)
      if (children && children.length > 0) {
        traverse(children)
      }
    })
  }
  traverse(tree)
  return result
}

/**
 * 将扁平数据转换为树形结构
 */
export function arrayToTree<T extends { id: string; parent_id: string | null }>(
  items: T[],
  parentId: string | null = null
): (T & { children?: T[] })[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .map((item) => {
      const children = arrayToTree(items, item.id)
      return children.length > 0 ? { ...item, children } : { ...item }
    })
}

/**
 * 获取状态文本
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    published: '已上架',
    archived: '已下架',
  }
  return statusMap[status] || status
}

/**
 * 获取状态类型
 */
export function getStatusType(status: string): 'info' | 'success' | 'warning' {
  const typeMap: Record<string, 'info' | 'success' | 'warning'> = {
    draft: 'info',
    published: 'success',
    archived: 'warning',
  }
  return typeMap[status] || 'info'
}

/**
 * 语言选项
 */
export const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'de', label: '德语' },
  { value: 'fr', label: '法语' },
  { value: 'es', label: '西班牙语' },
  { value: 'ru', label: '俄语' },
  { value: 'other', label: '其他' },
]

/**
 * 文件格式选项
 */
export const formatOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'epub', label: 'EPUB' },
  { value: 'mobi', label: 'MOBI' },
  { value: 'azw3', label: 'AZW3' },
]

/**
 * 获取语言文本
 */
export function getLanguageText(value: string): string {
  const option = languageOptions.find((opt) => opt.value === value)
  return option?.label || value
}
