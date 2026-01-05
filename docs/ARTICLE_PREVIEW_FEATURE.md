# 文章列表页面优化说明

## 🎯 功能概述

为文章列表页面添加了图片预览和摘要显示功能，提升用户浏览体验。

## ✨ 主要功能

### 1. 自动提取封面图片
- 提取整篇文章的**第一张图片**作为封面（无论图片位置）
- 显示在文章简介的**左侧**
- 响应式设计：
  - 移动端：图片占满宽度，高度 160px
  - 桌面端：固定宽度 192px，高度 128px

### 2. 自动提取摘要
- 提取分割线（`---`）**之前**的文本内容作为摘要
- 自动移除所有 Markdown 标记（图片、链接、粗体、斜体等）
- 限制长度为 200 字符，超出部分显示 "..."
- 显示在图片的**右侧**

### 3. 智能显示规则

| 情况 | 显示效果 |
|------|---------|
| 有图片 + 有摘要 | 左侧显示图片，右侧显示摘要 |
| 只有图片 | 只显示图片 |
| 只有摘要 | 只显示摘要 |
| 都没有 | 不显示预览区域 |

## 📁 修改的文件

### 1. `app/utils/common/types.ts`
```typescript
export type ArticleItem = ItemBase<{
  title: string;
  len: number;
  tags: string[];
  excerpt?: string; // 文章摘要
  coverImage?: string; // 封面图片
}>;
```

### 2. `app/utils/common/extract-preview.ts` (新建)
提取预览信息的工具函数：
- `extractArticlePreview(markdown: string)` - 从 Markdown 中提取摘要和封面图片

### 3. `app/pages/articles/index.vue`
- 添加 `articlePreviews` 响应式对象存储预览信息
- 添加 `loadArticlePreviews` 函数自动加载预览
- 更新 UI 显示图片和摘要

## 🚀 使用示例

### Markdown 文件格式示例

#### 示例 1：摘要 + 分割线 + 图片
```markdown
这是文章的摘要内容，会显示在列表页。

---

![文章配图](https://example.com/image.jpg)

### 正文标题

正文内容...
```
**显示效果**：左侧显示配图，右侧显示"这是文章的摘要内容，会显示在列表页。"

#### 示例 2：只有图片，没有分割线
```markdown
![封面图片](https://example.com/cover.jpg)

文章内容...
```
**显示效果**：只显示封面图片

#### 示例 3：没有分割线
```markdown
这是文章内容，没有分割线...
```
**显示效果**：不显示预览区域

## 🎨 样式特点

### 图片样式
- 圆角边框 (`rounded-lg`)
- 对象适应 (`object-cover`)
- Hover 时缩放效果 (`hover:scale-105`)
- 懒加载 (`loading="lazy"`)
- 加载失败时自动隐藏

### 摘要样式
- 多行省略 (移动端 3 行，桌面端 4 行)
- 柔和的文字颜色
- 响应式字体大小

### 响应式布局
- **移动端 (< 640px)**：垂直排列，图片在上，文字在下
- **桌面端 (≥ 640px)**：水平排列，图片在左，文字在右

## ⚡ 性能优化

1. **避免重复加载**：使用 `Set` 跟踪已加载的文章
2. **并行加载**：使用 `Promise.all` 同时加载多篇文章
3. **懒加载**：图片使用 `loading="lazy"` 属性
4. **响应式更新**：使用 `reactive` 对象确保 UI 自动更新

## 🧪 测试

运行单元测试：
```bash
pnpm test:unit extract-preview
```

## 📝 注意事项

1. 图片 URL 必须是完整的 HTTP/HTTPS 地址
2. 分割线必须是独立一行的 `---`
3. 摘要会自动移除所有 Markdown 格式标记
4. 如果图片加载失败，会自动隐藏图片元素

## 🔧 自定义配置

### 修改摘要长度
编辑 `app/utils/common/extract-preview.ts`：
```typescript
if (excerpt.length > 200) { // 修改这个数字
  excerpt = excerpt.substring(0, 200) + "...";
}
```

### 修改图片尺寸
编辑 `app/pages/articles/index.vue` 的图片类名：
```vue
class="h-40 w-full ... sm:h-32 sm:w-48"
       ↑移动端高度   ↑桌面端尺寸
```

### 修改摘要显示行数
编辑 `app/pages/articles/index.vue` 的文字类名：
```vue
class="line-clamp-3 ... sm:line-clamp-4"
       ↑移动端行数    ↑桌面端行数
```
