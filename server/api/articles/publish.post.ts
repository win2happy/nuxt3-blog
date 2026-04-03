import { readBody, createError } from "h3";
import { encode } from "js-base64";
import axios from "axios";
import config from "~~/config";
import type { ArticleItem } from "~/utils/common/types";

interface PublishArticleBody {
  token: string;
  title: string;
  content: string;
  tags?: string[];
  customSlug?: string;
  encrypt?: boolean;
  showComments?: boolean;
  isPinned?: boolean;
}

interface GitHubFile {
  path: string;
  content: string;
}

/**
 * 获取 GitHub 最新 commit SHA
 */
async function getLatestSha(token: string): Promise<string> {
  const apiUrl = config.githubApiUrl || "https://api.github.com";
  const query = `
    query {
      repository(name: "${config.githubRepo}", owner: "${config.githubName}") {
        ref(qualifiedName: "${useRuntimeConfig().app.githubBranch}") {
          target {
            ... on Commit {
              history(first: 1) {
                nodes {
                  oid
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await axios.post(
    `${apiUrl}/graphql`,
    { query },
    {
      headers: {
        Authorization: `token ${token}`
      }
    }
  );

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data.repository.ref.target.history.nodes[0].oid;
}

/**
 * 获取现有文章列表
 */
async function getArticles(token: string): Promise<ArticleItem[]> {
  const apiUrl = config.githubApiUrl || "https://api.github.com";
  const path = "public/rebuild/json/articles.json";

  try {
    const response = await axios.get(
      `${apiUrl}/repos/${config.githubName}/${config.githubRepo}/contents/${path}?ref=${useRuntimeConfig().app.githubBranch}`,
      {
        headers: {
          Authorization: `token ${token}`
        }
      }
    );

    const content = Buffer.from(response.data.content, "base64").toString("utf-8");
    return JSON.parse(content);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * 创建 GitHub commit
 */
async function createCommit(
  token: string,
  message: string,
  files: GitHubFile[],
  expectedHeadOid: string
): Promise<void> {
  const apiUrl = config.githubApiUrl || "https://api.github.com";

  const additions = files.map(file => ({
    path: file.path,
    contents: encode(file.content)
  }));

  const mutation = `
    mutation {
      createCommitOnBranch(
        input: {
          branch: {
            branchName: "${useRuntimeConfig().app.githubBranch}",
            repositoryNameWithOwner: "${config.githubName}/${config.githubRepo}"
          },
          message: {
            headline: "${message}"
          },
          expectedHeadOid: "${expectedHeadOid}",
          fileChanges: {
            additions: ${JSON.stringify(additions).replace(/"([^"]+)":/g, "$1:")}
          }
        }
      ) {
        clientMutationId
      }
    }
  `;

  const response = await axios.post(
    `${apiUrl}/graphql`,
    { query: mutation },
    {
      headers: {
        Authorization: `token ${token}`
      }
    }
  );

  if (response.data.errors) {
    throw new Error(response.data.errors[0].message);
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): number {
  return Math.floor(Math.random() * 90000000) + 10000000;
}

/**
 * 验证 token 是否是作者
 */
async function verifyAuthor(token: string): Promise<boolean> {
  const apiUrl = config.githubApiUrl || "https://api.github.com";

  try {
    const response = await axios.post(
      `${apiUrl}/graphql`,
      {
        query: `
          query {
            viewer {
              login
            }
          }
        `
      },
      {
        headers: {
          Authorization: `token ${token}`
        }
      }
    );

    if (response.data.errors) {
      return false;
    }

    return response.data.data.viewer.login === config.githubName;
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  // 只允许 POST 请求
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed"
    });
  }

  try {
    const body = await readBody<PublishArticleBody>(event);

    // 验证必要参数
    if (!body.token) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required field: token"
      });
    }

    if (!body.title || !body.title.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required field: title"
      });
    }

    if (!body.content || !body.content.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required field: content"
      });
    }

    // 验证 token 是否是作者
    const isAuthor = await verifyAuthor(body.token);
    if (!isAuthor) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: Invalid token or not authorized"
      });
    }

    // 获取现有文章列表
    const articles = await getArticles(body.token);

    // 生成新文章 ID
    let newId = generateId();
    while (articles.some(a => a.id === newId)) {
      newId = generateId();
    }

    // 检查 customSlug 是否重复
    if (body.customSlug) {
      const existingSlug = articles.find(a => a.customSlug === body.customSlug);
      if (existingSlug) {
        throw createError({
          statusCode: 400,
          statusMessage: `Custom slug "${body.customSlug}" already exists`
        });
      }
    }

    const now = Date.now();

    // 创建新文章对象
    const newArticle: ArticleItem = {
      id: newId,
      title: body.title.trim(),
      len: body.content.length,
      tags: body.tags || [],
      customSlug: body.customSlug || "",
      time: now,
      modifyTime: now,
      encrypt: body.encrypt || false,
      showComments: body.showComments !== false, // 默认 true
      isPinned: body.isPinned || false
    };

    // 添加新文章到列表
    articles.unshift(newArticle);

    // 准备提交的文件
    const files: GitHubFile[] = [
      {
        path: "public/rebuild/json/articles.json",
        content: JSON.stringify(articles)
      },
      {
        path: `public/rebuild/articles/${newId}.md`,
        content: body.content
      }
    ];

    // 获取最新 commit SHA
    const sha = await getLatestSha(body.token);

    // 创建 commit
    await createCommit(
      body.token,
      `[Publish Article] ${newArticle.title}`,
      files,
      sha
    );

    return {
      success: true,
      data: {
        id: newId,
        title: newArticle.title,
        url: `/articles/${body.customSlug || newId}`,
        time: now
      }
    };
  } catch (error: any) {
    console.error("Publish article error:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Internal Server Error"
    });
  }
});
