<template>
  <div class="news-aggregator min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
    <div class="container mx-auto max-w-7xl px-4 py-8">
      <!-- 头部标题 -->
      <div class="relative mb-12 text-center">
        <!-- 装饰元素 -->
        <div class="absolute inset-0 -z-10 overflow-hidden">
          <div class="absolute left-1/4 top-0 size-64 rounded-full bg-blue-400/10 blur-3xl" />
          <div class="absolute right-1/4 top-20 size-64 rounded-full bg-purple-400/10 blur-3xl" />
        </div>

        <div class="mb-4 inline-flex items-center justify-center">
          <div class="mr-4 h-1 w-16 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <span class="text-5xl">📰</span>
          <div class="ml-4 h-1 w-16 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>

        <h1 class="mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 md:text-6xl">
          每日新闻聚合
        </h1>
        <p class="mb-4 text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Daily News Aggregation
        </p>

        <div class="inline-flex items-center space-x-3 rounded-full bg-white/80 px-6 py-3 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">📅</span>
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ currentDate }}</span>
          </div>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <div class="flex items-center space-x-2">
            <span class="text-xl">🌙</span>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ lunarDate }}</span>
          </div>
        </div>

        <!-- 保存图片按钮 -->
        <div class="mt-6">
          <button
            class="group inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
            @click="showSaveModal = true"
          >
            <span class="text-xl">💾</span>
            <span>保存图片</span>
            <svg
              class="size-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 60秒读懂世界 -->
      <NewsQuickRead
        ref="newsRef"
        :news="quickNews"
      />

      <!-- 实时热搜 -->
      <HotTrends
        ref="trendsRef"
        :trends="hotTrends"
      />

      <!-- 底部区域 -->
      <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- 历史上的今天 -->
        <HistoryToday
          ref="historyRef"
          :events="historyEvents"
        />

        <!-- 右侧栏 -->
        <div class="space-y-8">
          <!-- 今日黄历 -->
          <DailyCalendar
            ref="calendarRef"
            :calendar="calendarInfo"
          />

          <!-- 每日一语 -->
          <DailyQuote
            ref="quoteRef"
            :quote="dailyQuote"
          />
        </div>
      </div>
    </div>

    <!-- 保存图片模态框 -->
    <SaveImageModal
      v-model="showSaveModal"
      @save="handleSaveImage"
    />

    <!-- Loading -->
    <Transition name="fade">
      <div
        v-if="isGenerating"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-800">
          <div class="mx-auto mb-4 size-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ generatingText }}
          </p>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            请稍候...
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import * as ImageGenerator from "~/utils/imageGenerator";

const newsRef = ref();
const trendsRef = ref();
const historyRef = ref();
const calendarRef = ref();
const quoteRef = ref();

const showSaveModal = ref(false);
const isGenerating = ref(false);
const generatingText = ref("正在生成图片");

const currentDate = computed(() => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
});

const lunarDate = ref("农历冬月廿五");

// 模拟数据 - 60秒读懂世界
const quickNews = ref([
  { id: 1, content: "上海2025年结婚登记125102对，比2024年增长38.7%，初婚平均年龄29.7岁", link: "#" },
  { id: 2, content: "多地医保大幅提高产检报销：北京最高可报1万元；北京母婴设施新规发布：第三卫生间不得替代母婴室", link: "#" },
  { id: 3, content: "六部门：严禁医疗机构开展殡仪服务，严厉打击倒卖死亡证明等行为", link: "#" },
  { id: 4, content: "官方数据显示：贵州省博老馆29件套文物丢失或被盗，均来自不同年代，最早于1986年丢失", link: "#" },
  { id: 5, content: "德勤报告：超6成中国人下辆车想买30万以上，燃油车仍是首选；乘联会：2025年我国乘用车均价17万元", link: "#" },
  { id: 6, content: "重庆合川一女子不会杀猪网上求助，上千名网友到场参与，直播间10万人在线围观，其账号3天涨粉超170万", link: "#" },
  { id: 7, content: "山东一医疗机构公告\"放弃低端患者\"，机构负责人称系为了保护自己，当地卫健局已介入", link: "#" },
  { id: 8, content: "12日沪指收出17连阳，两市单日成交额突破3.6万亿元创历史新高，两融余额也创下纪录", link: "#" },
  { id: 9, content: "人民币对美元即期汇率升至6.97，创近32个月新高；现货黄金站上4620美元/盎司，新年首月累涨逾300美元", link: "#" },
  { id: 10, content: "官方确认外销战机歼10CE首次取得实战战果：一举击落多架战机，自己无一损失", link: "#" },
  { id: 11, content: "英媒：马斯克X平台涌现大量涉未成年不当AI内容，英国已开展调查，印尼、马来西亚已封禁该聊天机器人", link: "#" },
  { id: 12, content: "韩媒：韩空难致179人死，失事前75秒黑匣子录音首次公布，调查称若飞机没有撞墙全员可生还", link: "#" },
  { id: 13, content: "美媒：美国航天局火星样本取回任务因资金问题被搁置，中国或将成为首个将火星样本带回地球的国家", link: "#" },
  { id: 14, content: "美媒：特朗普再次宣称无论如何要得到格陵兰岛，欧洲国家或派兵格陵兰岛，消解美国\"夺岛\"借口", link: "#" },
  { id: 15, content: "外媒：伊朗称111名安全人员骚乱中丧生，全国哀悼三天；特朗普被曝计划与马斯克商谈恢复伊朗互联网服务的问题", link: "#" }
]);

// 模拟数据 - 实时热搜
const hotTrends = ref([
  {
    platform: "百度热搜",
    icon: "🔍",
    link: "#",
    items: [
      { rank: 1, title: "以更高标准更实举措推进从严治党", heat: "790w", link: "#" },
      { rank: 2, title: "中国一口气申报20万颗卫星意味着什么", heat: "625w", link: "#" },
      { rank: 3, title: "沪指收出17连阳", heat: "518w", link: "#" },
      { rank: 4, title: "人民币升破6.97关口", heat: "472w", link: "#" },
      { rank: 5, title: "官方确认歼10CE战果", heat: "423w", link: "#" }
    ]
  },
  {
    platform: "微博热搜",
    icon: "📱",
    link: "#",
    items: [
      { rank: 1, title: "二十届中央纪委五次全会召开", heat: "HOT", link: "#" },
      { rank: 2, title: "老干妈创始人出山救子又赚翻了", heat: "爆", link: "#" },
      { rank: 3, title: "男子回应3年前预言成真", heat: "新", link: "#" },
      { rank: 4, title: "胖东来回应万达撤场", heat: "热", link: "#" },
      { rank: 5, title: "A股突破2.5万亿成交量", heat: "沸", link: "#" }
    ]
  },
  {
    platform: "抖音热点",
    icon: "🎵",
    link: "#",
    items: [
      { rank: 1, title: "官方确认歼10CE战果", heat: "1214w", link: "#" },
      { rank: 2, title: "加拿大总理卡尼将访华", heat: "1211w", link: "#" },
      { rank: 3, title: "2026年节假日安排", heat: "1108w", link: "#" },
      { rank: 4, title: "沪指17连阳创纪录", heat: "987w", link: "#" },
      { rank: 5, title: "春节档电影预售开启", heat: "854w", link: "#" }
    ]
  },
  {
    platform: "B站热搜",
    icon: "📺",
    link: "#",
    items: [
      { rank: 1, title: "皇马为何解雇阿隆索", heat: "", link: "#" },
      { rank: 2, title: "总台年度反腐大片第二集", heat: "", link: "#" },
      { rank: 3, title: "AI换脸技术的法律问题", heat: "", link: "#" },
      { rank: 4, title: "游戏原神新版本前瞻", heat: "", link: "#" },
      { rank: 5, title: "春节档电影全解析", heat: "", link: "#" }
    ]
  },
  {
    platform: "知乎日报",
    icon: "💡",
    link: "#",
    items: [
      { rank: 1, title: "为什么地球不会往下掉？", heat: "", link: "#" },
      { rank: 2, title: "男生健身应该着重锻炼哪些肌肉？", heat: "", link: "#" },
      { rank: 3, title: "一只霸王龙穿越到现在的非洲大草原会发生什么？", heat: "", link: "#" },
      { rank: 4, title: "瞎扯 · 如何正确地吐槽", heat: "", link: "#" },
      { rank: 5, title: "如何看待ChatGPT的最新更新？", heat: "", link: "#" }
    ]
  },
  {
    platform: "腾讯新闻热点",
    icon: "📰",
    link: "#",
    items: [
      { rank: 1, title: "以更高标准更实举措推进全面从严治党", heat: "161w", link: "#" },
      { rank: 2, title: "湖北省委原书记蒋超良出镜忏悔", heat: "275w", link: "#" },
      { rank: 3, title: "8所新大学，要来了", heat: "254w", link: "#" },
      { rank: 4, title: "坚持\"双碳\"引领，推动全面绿色转型", heat: "244w", link: "#" },
      { rank: 5, title: "人民币汇率大涨", heat: "198w", link: "#" }
    ]
  }
]);

// 模拟数据 - 历史上的今天
const historyEvents = ref([
  { year: 567, event: "大唐帝国开国皇帝，太宗李世民之父唐高祖李渊出生", link: "#" },
  { year: 888, event: "法兰克皇帝查理三世逝世", link: "#" },
  { year: 1716, event: "《康熙字典》成书", link: "#" },
  { year: 1847, event: "美国与墨西哥签署条约在加利福尼亚停战", link: "#" },
  { year: 1864, event: "诺贝尔物理学奖获得者威廉·维恩出生", link: "#" },
  { year: 1878, event: "中国军事、政治人物陈炯明出生", link: "#" },
  { year: 1904, event: "日俄战争爆发", link: "#" },
  { year: 1906, event: "中国语言学家、文字学家周有光出生", link: "#" },
  { year: 1908, event: "中、英、德签订《津浦铁路借款合同》", link: "#" },
  { year: 1927, event: "诺贝尔生理医学奖得主悉尼·布伦纳出生", link: "#" },
  { year: 1988, event: "蒋经国在台北逝世", link: "#" },
  { year: 1993, event: "《禁止化学武器公约》签订", link: "#" }
]);

// 模拟数据 - 今日黄历
const calendarInfo = ref({
  lunar: "农历冬月廿五",
  animal: "乙巳蛇年",
  month: "己丑月",
  day: "丁亥日",
  element: "屋上土",
  conflict: "冲(辛巳)蛇 煞西",
  suitable: ["开市", "交易", "立券", "纳财", "纳畜", "造畜稠", "入宅", "移徙", "安床", "开光", "祈福", "求嗣", "动土"],
  avoid: ["嫁娶", "栽种", "安葬", "理发", "造庙", "作灶", "入殓", "行丧", "造桥"],
  luckyGod: "月德合 王日",
  badGod: "游祸 血支 重日 朱雀",
  luckyDirection: "正南",
  wealthDirection: "西南"
});

// 模拟数据 - 每日一语
const dailyQuote = ref({
  text: "在哪里跌倒，就在哪里站起来，所有不能打败你的，都会促成你的成长。",
  content: "在哪里跌倒，就在哪里站起来，所有不能打败你的，都会促成你的成长。",
  author: "佚名"
});

// 处理保存图片
const handleSaveImage = async (type: string) => {
  isGenerating.value = true;

  try {
    let dataUrl = "";
    let filename = "";

    switch (type) {
      case "news-card": {
        generatingText.value = "正在生成60秒读懂世界红色卡片";
        const newsCardDate = new Date();
        filename = `${newsCardDate.getFullYear()}年${newsCardDate.getMonth() + 1}月${newsCardDate.getDate()}日-60秒读懂世界.png`;
        const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        dataUrl = await ImageGenerator.generateNewsCard(
          quickNews.value,
          {
            date: `${newsCardDate.getFullYear()}年${newsCardDate.getMonth() + 1}月${newsCardDate.getDate()}日`,
            weekDay: weekDays[newsCardDate.getDay()],
            lunarDate: lunarDate.value
            // 可选：自定义背景色
            // gradientStart: '#ff6b6b',
            // gradientEnd: '#ee5a6f',
          }
        );
        break;
      }

      case "trends": {
        generatingText.value = "正在生成实时热搜";
        const trendsDate = new Date();
        filename = `${trendsDate.getFullYear()}年${trendsDate.getMonth() + 1}月${trendsDate.getDate()}日-实时热搜.png`;
        // 使用Canvas生成卡片 - 合并所有平台的热搜
        const trendsWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const allTrends: any[] = [];
        hotTrends.value.forEach((platform) => {
          platform.items.forEach((item: any) => {
            allTrends.push({
              id: allTrends.length + 1,
              content: `【${platform.platform}】${item.title}`
            });
          });
        });
        dataUrl = await ImageGenerator.generateListCard(
          allTrends.slice(0, 15), // 只取前15条
          {
            title: "实时热搜",
            date: `${trendsDate.getFullYear()}年${trendsDate.getMonth() + 1}月${trendsDate.getDate()}日`,
            weekDay: trendsWeekDays[trendsDate.getDay()],
            lunarDate: lunarDate.value
          }
        );
        break;
      }

      case "history": {
        generatingText.value = "正在生成历史上的今天";
        const historyDate = new Date();
        filename = `${historyDate.getFullYear()}年${historyDate.getMonth() + 1}月${historyDate.getDate()}日-历史上的今天.png`;
        // 使用Canvas生成卡片，格式化历史事件（年份 + 事件）
        const historyWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const formattedHistory = historyEvents.value.map((item, index) => ({
          id: index + 1,
          content: `${item.year}年 ${item.event}`,
          hideNumber: true // 标记不显示序号
        }));
        dataUrl = await ImageGenerator.generateListCard(
          formattedHistory,
          {
            title: "历史上的今天",
            date: `${historyDate.getFullYear()}年${historyDate.getMonth() + 1}月${historyDate.getDate()}日`,
            weekDay: historyWeekDays[historyDate.getDay()],
            lunarDate: lunarDate.value,
            hideNumbers: true // 全局控制不显示序号
          }
        );
        break;
      }

      case "calendar": {
        generatingText.value = "正在生成今日黄历";
        const calendarFileDate = new Date();
        filename = `${calendarFileDate.getFullYear()}年${calendarFileDate.getMonth() + 1}月${calendarFileDate.getDate()}日-今日黄历.png`;
        // 使用Canvas生成卡片，按页面展示格式排版
        const calendarDate = new Date();
        const calendarWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const calendarItems = [
          { id: 1, content: `${calendarInfo.value.lunar}  ${calendarInfo.value.animal}  ${calendarInfo.value.month}  ${calendarInfo.value.day}` },
          { id: 2, content: "" }, // 空行
          { id: 3, content: `五行：${calendarInfo.value.element}` },
          { id: 4, content: `冲煞：${calendarInfo.value.conflict}` },
          { id: 5, content: "" }, // 空行
          { id: 6, content: `喜神：${calendarInfo.value.luckyDirection}` },
          { id: 7, content: "福神：东南" },
          { id: 8, content: `财神：${calendarInfo.value.wealthDirection}` },
          { id: 9, content: "" }, // 空行
          { id: 10, content: `宜：${calendarInfo.value.suitable.join("、")}` },
          { id: 11, content: `忌：${calendarInfo.value.avoid.join("、")}` },
          { id: 12, content: "" }, // 空行
          { id: 13, content: `吉神：${calendarInfo.value.luckyGod}` },
          { id: 14, content: `凶神：${calendarInfo.value.badGod}` }
        ];
        dataUrl = await ImageGenerator.generateListCard(
          calendarItems,
          {
            title: "今日黄历",
            date: `${calendarDate.getFullYear()}年${calendarDate.getMonth() + 1}月${calendarDate.getDate()}日`,
            weekDay: calendarWeekDays[calendarDate.getDay()],
            lunarDate: lunarDate.value,
            hideNumbers: true // 不显示序号
          }
        );
        break;
      }

      case "quote": {
        generatingText.value = "正在生成每日一语";
        const quoteFileDate = new Date();
        filename = `${quoteFileDate.getFullYear()}年${quoteFileDate.getMonth() + 1}月${quoteFileDate.getDate()}日-每日一语.png`;
        // 使用Canvas生成卡片
        const quoteDate = new Date();
        const quoteWeekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const quoteItems = [
          { id: 1, content: dailyQuote.value.content }
        ];
        dataUrl = await ImageGenerator.generateListCard(
          quoteItems,
          {
            title: "每日一语",
            date: `${quoteDate.getFullYear()}年${quoteDate.getMonth() + 1}月${quoteDate.getDate()}日`,
            weekDay: quoteWeekDays[quoteDate.getDay()],
            lunarDate: lunarDate.value,
            hideNumbers: true // 不显示序号
          }
        );
        break;
      }
    }

    if (dataUrl) {
      ImageGenerator.downloadImage(dataUrl, filename);
    }
  } catch (error) {
    console.error("生成图片失败:", error);
    alert("生成图片失败，请重试");
  } finally {
    isGenerating.value = false;
  }
};

// 设置页面元数据
useHead({
  title: "每日新闻聚合 - 60秒读懂世界",
  meta: [
    { name: "description", content: "聚合每日新闻、热搜榜单、历史事件、黄历信息等内容" }
  ]
});
</script>

<style scoped>
.news-aggregator {
  min-height: 100vh;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
