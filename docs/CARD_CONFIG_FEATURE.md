# 前端卡片样式配置功能说明

## 功能概述

实现了一个统一的前端卡片样式配置系统，允许用户在浏览器中配置新闻卡片的样式，配置会保存在 localStorage 中，无需重新部署即可生效。

## 实现的功能

### 1. 统一的前端配置管理 (`app/composables/useCardConfig.ts`)

- 使用 `useState` 创建全局配置状态
- 配置保存在 localStorage 中，刷新页面后仍然有效
- 优先使用前端配置，如果没有配置则使用 `config.ts` 中的默认值
- 提供了配置更新、重置等方法

### 2. 卡片样式配置界面 (`app/components/CardConfigModal.vue`)

- 提供颜色选择器和文本输入框来配置：
  - 背景渐变起始色
  - 背景渐变结束色
  - 内容区域背景色
  - 头部文字颜色
- 实时预览效果
- 支持恢复默认配置

### 3. 应用配置到所有卡片

配置统一应用到以下所有模块：

- ✅ 60秒读懂世界
- ✅ 实时热搜
- ✅ 历史上的今天
- ✅ 今日黄历
- ✅ 每日一语

### 4. 配置入口

在 `/news` 页面头部添加了"样式配置"按钮，点击即可打开配置界面。

## 使用方法

1. 访问 `/news` 页面
2. 点击页面顶部的"🎨 样式配置"按钮
3. 在弹出的配置界面中：
   - 使用颜色选择器或直接输入颜色值
   - 查看预览效果
   - 点击"💾 保存"保存配置
   - 点击"🔄 恢复默认"可以重置为 config.ts 中的配置
4. 配置会立即生效，并保存在浏览器本地

## 技术实现

### 配置优先级

```
前端配置 (localStorage) > config.ts 中的配置 > 默认硬编码值
```

### 文件修改清单

#### 新增文件：
- `app/composables/useCardConfig.ts` - 配置管理
- `app/components/CardConfigModal.vue` - 配置界面

#### 修改文件：
- `app/pages/news/index.vue` - 添加配置按钮，使用前端配置
- `app/components/SaveImageModal.vue` - 简化为使用统一配置

### 配置数据结构

```typescript
interface CardConfig {
  gradientStart: string;           // 背景渐变起始色
  gradientEnd: string;              // 背景渐变结束色
  contentBackgroundColor: string;   // 内容区域背景色
  headerTextColor: string;          // 头部文字颜色
}
```

## 优势

1. **无需重新部署**：配置保存在浏览器本地，修改后立即生效
2. **统一管理**：所有卡片使用相同的配置，保持视觉一致性
3. **易于使用**：提供友好的图形界面，支持颜色选择器
4. **灵活性**：可以随时恢复默认配置
5. **持久化**：配置保存在 localStorage，刷新页面后依然有效

## 注意事项

- 配置保存在浏览器的 localStorage 中，清除浏览器数据会导致配置丢失
- 不同浏览器/设备的配置是独立的
- 如果需要在所有设备上使用相同配置，建议修改 `config.ts` 中的默认值后重新部署
