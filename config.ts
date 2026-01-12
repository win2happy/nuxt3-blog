export default {
  /** -------------------------------------------------以下必须修改----------------------------------------------------- */

  githubName: "win2happy", // 必须修改，github账户名

  /** -------------------------------------------------以下可选修改----------------------------------------------------- */

  githubApiUrl: "https://github-api.499736649.workers.dev", // 自定义GitHub API域名，为空则使用默认的 https://api.github.com
  title: "Imuer视界", // 网站标题
  nickName: "IM", // 昵称
  domain: "https://imuer.pnt.pp.ua", // rss域名
  SEO_title: " - IM blog", // 搜索引擎显示的标题
  SEO_keywords: "IM,imuer's blog,Imuer视界,Imuer视界的博客", // keywords meta header
  MSClarityId: "uqyzrv8y66", // Microsoft的Clarity统计，https://clarity.microsoft.com/
  CloudflareAnalyze: "1c42957b8103aa01e99ea05293952604", // cloudflare的统计，https://developers.cloudflare.com/analytics/web-analytics
  CommentRepoId: "R_kgDOQuotxw", // 评论系统，参考 https://github.com/win2happy/nuxt3-blog/wiki/2.3-%E8%AF%84%E8%AE%BA%E7%B3%BB%E7%BB%9F
  CommentDiscussionCategoryId: "DIC_kwDOQuotx84C0Oko", // 评论系统

  database: { // 参考 https://github.com/win2happy/nuxt3-blog/wiki/2.4-%E6%B5%8F%E8%A7%88%E9%87%8F%E7%BB%9F%E8%AE%A1
    initialVisitors: 1, // 如果设置成10000，那么发一篇文章立马就有10000个浏览量！
    visitFromOwner: false // 网站拥有者访问时，是否增加浏览量
  },
  algoliaSearch: { // 参考 https://github.com/win2happy/nuxt3-blog/wiki/2.5-%E5%85%A8%E7%AB%99%E6%90%9C%E7%B4%A2
    appId: "ZO74SFHXCN",
    searchKey: "917aba08becc2f02c1d11216f436ddb9",
    indexName: "nuxt3-blog"
  },
  themeColor: ["cyan", "sky", "teal", "emerald", "purple", "indigo", "fuchsia", "orange", "amber"], // 主题色，如果有多个颜色，则随机使用，参考 https://tailwindcss.com/docs/colors
  themeColorDark: "neutral", // 主题色(夜间模式)
  defaultLang: "zh", // default language, "zh" and "en" are supported currently
  mobileNavMode: "content-tabs", // 移动端导航栏模式："function-buttons" (主导航显示：语言/主题/密码/火箭，下拉菜单显示：Articles/Records/Knowledges/timeline/搜索) 或 "content-tabs" (主导航显示：Articles/Records/Knowledges/搜索/主题，下拉菜单显示：时间轴/语言/密码/火箭)
  about: [
    "星海浮沉百亿秋，微光一缕系离愁",
    "我倚晚风望遥穹，相思尽付此间柔",
    "流火掠空惊夜寂，疑是你含笑凝眸",
    "碎光落处轻声祷，岁岁平安与君候",
    "——2025.9.15"
  ],

  readingProgress: { // 阅读进度条配置
    enabled: true, // 是否启用阅读进度条
    color: "", // 进度条颜色，支持主题色名称（cyan/sky/teal/emerald/purple/indigo/fuchsia/orange/amber）或自定义颜色（如 "#3b82f6"）如果为空时则使用主题色
    height: 5, // 进度条高度（像素）
    position: "bottom" // 进度条位置：top（顶部）或 bottom（底部）
  },

  /** -------------------------------------------------注意----------------------------------------------------- */

  githubRepo: "nuxt3-blog" // 需要与仓库名一致，如果fork时更改了仓库名，则这里也要改
};
