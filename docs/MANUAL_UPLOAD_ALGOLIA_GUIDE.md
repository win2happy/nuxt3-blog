# 📤 手动上传 Algolia 索引数据指南

## 概述

如果自动上传遇到网络问题，您可以导出数据为 JSON 文件，然后在 Algolia Dashboard 中手动上传。

## 📋 步骤 1: 导出数据

运行导出命令：

```bash
npm run local:export-algolia
```

或者：

```bash
pnpm run local:export-algolia
```

### 导出内容说明

脚本会导出以下内容：

**文章 (/articles)**
- 标题 (title)
- 内容文本 (content)
- 标签 (metaData)
- 描述 (description)

**知识库 (/knowledges)**
- 标题 (title)
- 内容文本 (content)
- 封面图 (cover)
- 类型 (metaData)
- 描述 (description)

**记录 (/records)**
- 图片描述作为标题 (title)
- 第一张图作为封面 (cover)
- 图片数量 (metaData)
- 描述 (description)

### 输出文件

导出完成后会生成文件：
```
algolia-index-data.json
```

位置：项目根目录

## 📋 步骤 2: 登录 Algolia Dashboard

1. 访问：https://www.algolia.com/dashboard
2. 使用您的账号登录
3. 选择您的应用（Application ID: ZO74SFHXCN）

## 📋 步骤 3: 进入索引管理

1. 在左侧菜单点击 **Search** → **Index**
2. 查找索引 `nuxt3-blog`
   - 如果存在，点击进入
   - 如果不存在，点击 **Create Index** 创建，名称填 `nuxt3-blog`

## 📋 步骤 4: 上传数据

### 方法 A: 使用 Upload Records（推荐）

1. 在索引页面，点击右上角的 **Upload record(s)** 按钮
2. 或者点击 **Add records** → **Upload file**
3. 选择刚才导出的 `algolia-index-data.json` 文件
4. 点击 **Upload** 或 **Import**
5. 等待上传完成（会显示进度）

### 方法 B: 使用 API Client（如果 UI 上传失败）

如果文件太大，Dashboard 可能无法上传，可以使用以下方法：

**在线工具**：
1. 访问 https://www.algolia.com/doc/tools/cli/get-started/overview/
2. 使用 Algolia CLI 工具
3. 或者使用在线 API 测试工具

**使用 curl（Windows PowerShell）**：

```powershell
$headers = @{
    "X-Algolia-API-Key" = "xxx"
    "X-Algolia-Application-Id" = "xxx"
    "Content-Type" = "application/json"
}

$data = Get-Content algolia-index-data.json -Raw

Invoke-RestMethod -Uri "https://xxx.algolia.net/1/indexes/nuxt3-blog/batch" -Method POST -Headers $headers -Body $data
```

## 📋 步骤 5: 验证上传

1. 在 Algolia Dashboard 的索引页面
2. 查看 **Records** 数量
3. 应该显示上传的记录数（例如：50 records）
4. 点击 **Browse** 查看具体记录
5. 确认数据正确

## 📋 步骤 6: 测试搜索

1. 在 Algolia Dashboard 中测试：
   - 点击索引页面的 **Search** 标签
   - 输入关键词测试

2. 在您的博客网站测试：
   - 打开网站
   - 点击搜索按钮或按 Ctrl+K
   - 输入关键词
   - 应该能看到搜索结果了！

## 🔄 更新数据

当您的博客内容更新后，需要重新上传：

### 方法 1: 完全替换
1. 在索引页面点击 **Settings** → **Delete**
2. 删除旧索引
3. 重新创建索引
4. 上传新的数据文件

### 方法 2: 增量更新（推荐）
Algolia 会根据 `objectID` 自动合并：
- 相同 `objectID` 的记录会被更新
- 新的 `objectID` 会被添加
- 直接上传新文件即可

## 📊 数据格式示例

导出的 JSON 文件格式：

```json
[
  {
    "objectID": "/articles/1",
    "title": "文章标题",
    "content": "文章的纯文本内容...",
    "description": "文章摘要...",
    "metaData": ["标签1", "标签2"],
    "cover": ""
  },
  {
    "objectID": "/knowledges/2",
    "title": "知识库标题",
    "content": "知识库内容...",
    "description": "知识库摘要...",
    "cover": "封面图URL",
    "metaData": "book"
  }
]
```

## ❓ 常见问题

### Q: 文件太大无法上传？
A: 
1. Algolia Dashboard 单次上传有大小限制（约 10MB）
2. 可以分批上传：手动编辑 JSON 文件，分成多个小文件
3. 或者使用 API 批量上传

### Q: 上传后搜索没有结果？
A: 
1. 等待几秒，Algolia 需要建立索引
2. 检查 `indexName` 是否正确（config.ts 中应该是 `nuxt3-blog`）
3. 在 Dashboard 中测试搜索

### Q: 想清空所有数据重新上传？
A:
1. 索引页面 → Settings → Delete index
2. 重新创建索引
3. 上传新数据

### Q: 加密的文章会被导出吗？
A: 不会。导出脚本会自动跳过标记为加密的内容。

## 💡 优势

手动上传的优势：
- ✅ 不受本地网络限制
- ✅ 可以检查数据内容
- ✅ 可以分批上传
- ✅ 可以随时重新上传

## 📝 总结

**完整流程**：
1. `npm run local:export-algolia` - 导出数据
2. 登录 Algolia Dashboard
3. 找到/创建索引 `nuxt3-blog`
4. Upload records - 选择 `algolia-index-data.json`
5. 等待上传完成
6. 验证数据
7. 测试搜索功能

完成后，搜索功能就可以使用了！🎉
