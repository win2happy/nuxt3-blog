import fs from "fs";
import path from "path";
import { parseMarkdown } from "../app/utils/common/markdown";
import type { AlgoliaBody, ArticleItem, KnowledgeItem, RecordItem } from "../app/utils/common/types";
import extractTextFromHtml from "./utils/html";

function walkAllBlogData() {
  const rebuildDir = path.join(process.cwd(), "public/rebuild");
  const result: Array<{ type: string; list: any[] }> = [];

  // 读取文章
  const articlesFile = path.join(rebuildDir, "json/articles.json");
  if (fs.existsSync(articlesFile)) {
    const articles = JSON.parse(fs.readFileSync(articlesFile, "utf-8"));
    result.push({ type: "/articles", list: articles });
  }

  // 读取知识库
  const knowledgesFile = path.join(rebuildDir, "json/knowledges.json");
  if (fs.existsSync(knowledgesFile)) {
    const knowledges = JSON.parse(fs.readFileSync(knowledgesFile, "utf-8"));
    result.push({ type: "/knowledges", list: knowledges });
  }

  // 读取记录
  const recordsFile = path.join(rebuildDir, "json/records.json");
  if (fs.existsSync(recordsFile)) {
    const records = JSON.parse(fs.readFileSync(recordsFile, "utf-8"));
    result.push({ type: "/records", list: records });
  }

  return result;
}

async function exportAlgoliaData() {
  console.log("\n=== 开始导出 Algolia 数据 ===\n");

  const blogData = walkAllBlogData();
  const allRecords: Array<AlgoliaBody & { objectID: string }> = [];

  let totalItems = 0;
  let encryptedItems = 0;

  for (const { type, list } of blogData) {
    console.log(`\n正在处理 ${type}...`);

    for (const item of list) {
      totalItems++;

      // 跳过加密的内容
      if (item.encrypt) {
        encryptedItems++;
        console.log(`  ⏭️  跳过加密项: ${item.id}`);
        continue;
      }

      try {
        // 读取 markdown 文件
        const mdFile = path.join(process.cwd(), "public/rebuild", type.substring(1), `${item.id}.md`);

        if (!fs.existsSync(mdFile)) {
          console.log(`  ⏭️  文件不存在: ${mdFile}`);
          continue;
        }

        const mdContent = fs.readFileSync(mdFile, "utf-8");

        // 解析 Markdown 为 HTML
        const html = (await parseMarkdown(mdContent)).md;

        // 从 HTML 提取纯文本
        const extractedText = extractTextFromHtml(html);

        const objectID = `${type}/${item.id}`;
        const body: AlgoliaBody & { objectID: string } = {
          title: "",
          metaData: {},
          cover: "",
          content: extractedText,
          objectID
        };

        // 根据类型设置不同的字段
        if (type === "/articles") {
          body.title = (item as ArticleItem).title;
          body.metaData = (item as ArticleItem).tags;
          body.description = extractedText.substring(0, 200); // 添加描述
        } else if (type === "/records") {
          body.title = (item as RecordItem).images.map(img => img.alt).join(" | ");
          body.cover = (item as RecordItem).images[0]?.src ?? "";
          body.metaData = (item as RecordItem).images.length;
          body.description = `${(item as RecordItem).images.length} 张图片`;
        } else {
          body.title = (item as KnowledgeItem).title;
          body.cover = (item as KnowledgeItem).cover;
          body.metaData = (item as KnowledgeItem).type;
          body.description = extractedText.substring(0, 200);
        }

        allRecords.push(body);
        console.log(`  ✅ ${body.title || objectID}`);
      } catch (error: any) {
        console.error(`  ❌ 处理失败: ${item.id} - ${error.message}`);
      }
    }
  }

  // 保存到文件
  const outputFile = path.join(process.cwd(), "algolia-index-data.json");
  fs.writeFileSync(outputFile, JSON.stringify(allRecords, null, 2), "utf-8");

  console.log("\n=== 导出完成 ===\n");
  console.log(`总计项目: ${totalItems}`);
  console.log(`加密项目（已跳过）: ${encryptedItems}`);
  console.log(`导出记录: ${allRecords.length}`);
  console.log(`\n文件已保存到: ${outputFile}`);
  console.log(`文件大小: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);

  // 按类型统计
  const stats: Record<string, number> = {};
  allRecords.forEach((record) => {
    const type = record.objectID.split("/")[0];
    stats[type] = (stats[type] || 0) + 1;
  });

  console.log("\n按类型统计:");
  Object.entries(stats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 条`);
  });

  console.log("\n=== 下一步操作 ===");
  console.log("1. 打开文件: algolia-index-data.json");
  console.log("2. 登录 Algolia Dashboard: https://www.algolia.com/dashboard");
  console.log("3. 选择您的应用");
  console.log("4. 进入 Indices 页面");
  console.log("5. 选择或创建索引: nuxt3-blog");
  console.log("6. 点击 'Upload record(s)' 或 'Add records'");
  console.log("7. 选择 algolia-index-data.json 文件上传");
  console.log("8. 等待上传完成\n");
}

exportAlgoliaData().catch((error) => {
  console.error("\n❌ 导出失败:", error);
  process.exit(1);
});
