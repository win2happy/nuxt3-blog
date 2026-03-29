<script setup lang="ts">
import throttle from "lodash/throttle.js";
import debounce from "lodash/debounce.js";
import { Columns2, Loader2, Menu, SquareAsterisk } from "lucide-vue-next";
import type { editor as MonacoEditor } from "monaco-editor";
import StickerPick from "./sticker-pick.vue";
import { initViewer } from "~/utils/nuxt/viewer";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import { useUnmount } from "~/utils/hooks/useUnmount";

const props = defineProps<{
  disabled?: boolean;
  loading?: boolean;
  single?: boolean;
}>();

const inputValue = defineModel<string>({ required: true });

let editor: MonacoEditor.IStandaloneCodeEditor;

const currentView = ref<"edit" | "preview" | "both">("both");
const currentText = ref("");

const destroyFns = useUnmount();

const { htmlContent, markdownRef, menuItems } = await useMarkdownParser({
  mdValueRef: currentText,
  fromEdit: true,
  destroyFns
});

// sticker
const showStickers = ref(false);
const insertSticker = (text: string) => {
  if (editor) {
    editor.trigger("keyboard", "type", { text });
  }
};

const showPreviewContents = ref(false);

// resize
const root = ref<HTMLElement>();
const leftSideWidth = ref(0);
const lisetenResize = throttle((e: MouseEvent | TouchEvent) => {
  const x = e instanceof MouseEvent ? e.x : e.touches[0]?.clientX ?? 0;
  const width = x - root.value!.getBoundingClientRect().x;
  leftSideWidth.value = width > 0 ? width : 1;
}, 50);

const startResize = () => {
  window.addEventListener("mousemove", lisetenResize);
  window.addEventListener("touchmove", lisetenResize);
  window.addEventListener("mouseup", stopResize);
  window.addEventListener("touchend", stopResize);
  document.body.classList.add("resizing");
};
const stopResize = () => {
  window.removeEventListener("mouseup", stopResize);
  window.removeEventListener("touchend", stopResize);
  window.removeEventListener("mousemove", lisetenResize);
  window.removeEventListener("touchmove", lisetenResize);
  document.body.classList.remove("resizing");
};

// 智能提示相关
const showSuggestions = ref(false);
const suggestions = ref<any[]>([]);
const selectedSuggestion = ref(0);
const suggestionPosition = ref({ x: 0, y: 0 });
const inputText = ref("");

// 定义智能提示项
const suggestionItems = [
  // 标题
  { id: "h1", label: "一级标题", insertText: "# 一级标题\n", shortcut: "h1", icon: "H1" },
  { id: "h2", label: "二级标题", insertText: "## 二级标题\n", shortcut: "h2", icon: "H2" },
  { id: "h3", label: "三级标题", insertText: "### 三级标题\n", shortcut: "h3", icon: "H3" },
  { id: "h4", label: "四级标题", insertText: "#### 四级标题\n", shortcut: "h4", icon: "H4" },
  { id: "h5", label: "五级标题", insertText: "##### 五级标题\n", shortcut: "h5", icon: "H5" },
  { id: "h6", label: "六级标题", insertText: "###### 六级标题\n", shortcut: "h6", icon: "H6" },

  // 文本格式化
  { id: "bold", label: "粗体", insertText: "**粗体文本**", shortcut: "bold", icon: "B" },
  { id: "italic", label: "斜体", insertText: "*斜体文本*", shortcut: "italic", icon: "I" },
  { id: "strikethrough", label: "删除线", insertText: "~~删除线文本~~", shortcut: "strikethrough", icon: "S" },
  { id: "underline", label: "下划线", insertText: "_(下划线文本)_", shortcut: "underline", icon: "U" },
  { id: "color", label: "彩色文本", insertText: "-(#ff0000: 彩色文本)-", shortcut: "color", icon: "C" },

  // 链接和图片
  { id: "link", label: "链接", insertText: "#[链接文本](https://example.com)", shortcut: "link", icon: "🔗" },
  { id: "image", label: "图片", insertText: "![图片描述](图片链接)", shortcut: "image", icon: "🖼️" },

  // 代码
  { id: "code", label: "代码块", insertText: "```javascript\n// 代码\n```", shortcut: "code", icon: "💻" },
  { id: "inlinecode", label: "行内代码", insertText: "`行内代码`", shortcut: "inlinecode", icon: "`" },

  // 列表
  { id: "ul", label: "无序列表", insertText: "- 无序列表项\n- 无序列表项\n", shortcut: "ul", icon: "•" },
  { id: "ol", label: "有序列表", insertText: "1. 有序列表项\n2. 有序列表项\n", shortcut: "ol", icon: "1." },
  { id: "task", label: "任务列表", insertText: "- [x] 已完成任务\n- [ ] 未完成任务\n", shortcut: "task", icon: "☑️" },

  // 引用和表格
  { id: "quote", label: "引用", insertText: "> 引用文本\n", shortcut: "quote", icon: ">" },
  { id: "table", label: "表格", insertText: "| 表头1 | 表头2 |\n| ---- | ---- |\n| 单元格1 | 单元格2 |\n", shortcut: "table", icon: "📊" },

  // 数学公式
  { id: "math", label: "数学公式", insertText: "$$数学公式$$", shortcut: "math", icon: "∑" },
  { id: "mathblock", label: "块级数学公式", insertText: "$$\n数学公式\n$$", shortcut: "mathblock", icon: "∫" },

  // 媒体
  { id: "youtube", label: "YouTube视频", insertText: "[youtube][视频标题](https://www.youtube.com/embed/视频ID)", shortcut: "youtube", icon: "🎥" },
  { id: "bili", label: "B站视频", insertText: "[bili][视频标题](https://player.bilibili.com/player.html?aid=视频ID)", shortcut: "bili", icon: "📺" },
  { id: "video", label: "视频", insertText: "[video][视频标题](海报链接|视频链接)", shortcut: "video", icon: "🎬" },
  { id: "audio", label: "音频", insertText: "[audio][音频标题](音频链接)", shortcut: "audio", icon: "🎵" },

  // 容器
  { id: "info", label: "信息容器", insertText: "::: info\n信息内容\n:::", shortcut: "info", icon: "ℹ️" },
  { id: "tip", label: "提示容器", insertText: "::: tip\n提示内容\n:::", shortcut: "tip", icon: "💡" },
  { id: "warning", label: "警告容器", insertText: "::: warning\n警告内容\n:::", shortcut: "warning", icon: "⚠️" },
  { id: "danger", label: "危险容器", insertText: "::: danger\n危险内容\n:::", shortcut: "danger", icon: "🚨" },
  { id: "details", label: "详情容器", insertText: "::: details 详情标题\n详情内容\n:::", shortcut: "details", icon: "🔽" },

  // 其他
  { id: "encrypt", label: "加密块", insertText: "[encrypt]\n加密内容\n[/encrypt]", shortcut: "encrypt", icon: "🔒" },
  { id: "html", label: "原始HTML", insertText: "[html]\n<div>HTML内容</div>\n[/html]", shortcut: "html", icon: "<>'" },
  { id: "fieldset", label: "字段集", insertText: "--字段集标题--\n字段集内容\n-- --", shortcut: "fieldset", icon: "📋" },
  { id: "sticker", label: "贴纸", insertText: "![sticker](sticker/yellow-face/18)", shortcut: "sticker", icon: "😊" }
];

// 过滤建议
const filterSuggestions = (text: string) => {
  if (!text) {
    suggestions.value = suggestionItems;
  } else {
    suggestions.value = suggestionItems.filter(item =>
      item.label.toLowerCase().includes(text.toLowerCase())
      || item.shortcut.toLowerCase().includes(text.toLowerCase())
    );
  }
  selectedSuggestion.value = 0;
};

// 插入选中的建议
const insertSuggestion = (suggestion: any) => {
  if (editor) {
    // 获取当前光标位置
    const position = editor.getPosition();
    if (position) {
      // 获取当前行内容
      const lineContent = editor.getModel()!.getLineContent(position.lineNumber);
      // 找到/的位置
      const slashIndex = lineContent.lastIndexOf("/");
      if (slashIndex !== -1) {
        // 计算需要替换的范围
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: slashIndex + 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        };
        // 替换文本
        editor.executeEdits("suggestion", [{
          range,
          text: suggestion.insertText,
          forceMoveMarkers: true
        }]);
      }
    }
  }
  showSuggestions.value = false;
  inputText.value = "";
};

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (!showSuggestions.value) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedSuggestion.value = (selectedSuggestion.value + 1) % suggestions.value.length;
      break;
    case "ArrowUp":
      e.preventDefault();
      selectedSuggestion.value = (selectedSuggestion.value - 1 + suggestions.value.length) % suggestions.value.length;
      break;
    case "Enter":
      e.preventDefault();
      if (suggestions.value[selectedSuggestion.value]) {
        insertSuggestion(suggestions.value[selectedSuggestion.value]);
      }
      break;
    case "Escape":
      e.preventDefault();
      showSuggestions.value = false;
      inputText.value = "";
      break;
  }
};

// 初始化manoco。mounted 或者 loadingChange 后执行，但只执行一次
const { themeMode } = useThemeMode();
const editorContainer = ref<HTMLElement>();
const initEditor = async () => {
  if (props.loading || editor) {
    return;
  }
  if (!editorContainer.value) {
    return;
  }
  currentText.value = inputValue.value;
  const module = await import("monaco-editor");
  if (!editorContainer.value) {
    return;
  }
  currentText.value = inputValue.value;
  editor = module.editor.create(editorContainer.value, {
    value: inputValue.value,
    language: "markdown",
    theme: "vs",
    wordWrap: "on",
    automaticLayout: true,
    glyphMargin: false,
    folding: false,
    minimap: {
      enabled: false
    },
    readOnly: props.disabled
  });
  watch(themeMode, (mode) => {
    editor.updateOptions({
      theme: mode === "light" ? "vs" : "vs-dark"
    });
  }, { immediate: true });
  editor.onDidChangeModelContent(
    debounce(() => {
      const text = editor.getModel()!.getValue();
      inputValue.value = text;
      currentText.value = text;
    }, 500)
  );

  // 监听键盘输入
  editor.onKeyDown((e) => {
    handleKeyDown(e.event);
  });

  // 监听文本变化，检测/
  editor.onDidChangeModelContent(() => {
    const position = editor.getPosition();
    if (position) {
      const lineContent = editor.getModel()!.getLineContent(position.lineNumber);
      const column = position.column - 1;

      // 检查是否输入了/
      if (column >= 0 && lineContent[column] === "/") {
        // 检查/是否在行首或前面只有空格
        const textBefore = lineContent.substring(0, column);
        if (textBefore.trim() === "") {
          // 显示建议
          showSuggestions.value = true;
          filterSuggestions("");

          // 计算建议面板位置
          const domPosition = editor.getTargetAtClientPoint(column, position.lineNumber);
          if (domPosition && domPosition.position) {
            const element = editorContainer.value;
            if (element) {
              suggestionPosition.value = {
                x: domPosition.position.left,
                y: domPosition.position.top + 20
              };
            }
          }
        }
      } else if (column > 0 && lineContent[column - 1] === "/") {
        // 过滤建议
        const textAfterSlash = lineContent.substring(lineContent.lastIndexOf("/") + 1, column + 1);
        inputText.value = textAfterSlash;
        filterSuggestions(textAfterSlash);
      } else {
        // 隐藏建议
        showSuggestions.value = false;
        inputText.value = "";
      }
    }
  });
};

watch(inputValue, (text) => {
  if (editor && text !== editor.getModel()!.getValue()) {
    editor.getModel()!.setValue(text);
  }
});
watch(() => props.loading, initEditor);
watch(() => props.disabled, (readOnly) => {
  editor?.updateOptions({ readOnly });
});

onMounted(initEditor);
onBeforeUnmount(() => {
  editor?.dispose();
});
initViewer(markdownRef);
</script>

<template>
  <div
    ref="root"
    class="relative flex h-[98vh] flex-col"
  >
    <div
      v-if="props.loading"
      class="absolute inset-0 flex items-center justify-center bg-dark-500/50"
    >
      <Loader2 class="size-6 animate-spin" />
    </div>
    <div class="relative flex items-center justify-between gap-6 border-b border-dark-200 px-2 pb-2 dark:border-dark-700 max-md:gap-2">
      <button
        :title="$t('add-sticker')"
        class="icon-button"
        @click="showStickers = true"
      >
        <img
          class="size-6"
          src="/sticker/yellow-face/18.png"
        >
        <StickerPick
          v-model="showStickers"
          class=""
          @insert-sticker="insertSticker"
        />
      </button>
      <NuxtLink
        v-if="!single"
        :title="$t('markdown-ref')"
        :to="'/manage/md-ref'"
        target="_blank"
        class="icon-button"
      >
        <SquareAsterisk class="size-6" />
      </NuxtLink>
      <button
        class="icon-button ml-auto"
        :title="$t('contents')"
        @click="menuItems.length && (showPreviewContents = true)"
      >
        <Menu class="size-6" />
        <common-dropdown
          v-model:show="showPreviewContents"
          :wrap-class="$style.menuDropdown"
        >
          <div class="flex max-h-[50vh] w-32 max-w-full flex-col overflow-auto p-2">
            <div
              v-for="(anchor, idx) in menuItems"
              :key="idx"
              class="text-start"
            >
              <span
                :class="twMerge(
                  'text-sm py-1',
                  anchor.size === 'small' && 'text-xs pl-2'
                )"
                :title="anchor.text"
              >
                <span v-html="anchor.text" />
              </span>
            </div>
          </div>
        </common-dropdown>
      </button>
      <button
        class="icon-button"
        :title="$t('toggle-view-mode')"
        @click="currentView = currentView == 'both' ? 'edit'
          : currentView == 'edit'
            ? 'preview'
            : 'both'
        "
      >
        <Columns2 class="size-6" />
      </button>
    </div>
    <div class="flex grow overflow-hidden border border-dark-200 dark:border-dark-700">
      <div
        :class="twMerge(
          'w-1/2 min-w-24 h-full relative',
          currentView === 'both' && '',
          currentView === 'edit' && 'w-full',
          currentView === 'preview' && 'hidden'
        )"
        :style="
          currentView == 'both'
            ? `width: ${leftSideWidth ? `${leftSideWidth}px` : ''}`
            : ''
        "
      >
        <div
          ref="editorContainer"
          class="h-full"
        />

        <!-- 智能提示面板 -->
        <div
          v-if="showSuggestions && suggestions.length > 0"
          class="absolute z-50 max-h-96 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-dark-800"
          :style="{
            left: `${suggestionPosition.x}px`,
            top: `${suggestionPosition.y}px`
          }"
        >
          <div class="mb-2 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <div class="rounded-full bg-purple-100 p-1 dark:bg-purple-900">
                <span class="font-medium text-purple-600 dark:text-purple-300">✨</span>
              </div>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">智能提示</span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              12
            </div>
          </div>
          <div class="space-y-1">
            <div
              v-for="(item, index) in suggestions"
              :key="item.id"
              :class="twMerge(
                'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                index === selectedSuggestion && 'bg-purple-100 dark:bg-purple-900'
              )"
              @click="insertSuggestion(item)"
            >
              <div class="flex items-center gap-3">
                <div class="flex size-6 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {{ index + 1 }}
                </div>
                <div class="flex items-center gap-2">
                  <div class="rounded bg-gray-200 p-1 text-sm dark:bg-gray-600">
                    {{ item.icon }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ item.label }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      插入{{ item.label }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {{ item.shortcut }}
              </div>
            </div>
          </div>
          <div class="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <div>⇧ # 导航</div>
            <div>Enter 选择</div>
            <div>Esc 关闭</div>
          </div>
        </div>
      </div>
      <div
        ref="resizeRef"
        :class="twMerge(
          $style.resize,
          currentView !== 'both' && '!hidden'
        )"
        @touchstart="startResize"
        @mousedown.left="startResize"
      >
        <span
          v-for="i in 3"
          :key="i"
          class="size-1 rounded-full bg-dark-400 dark:bg-dark-900"
        />
      </div>
      <div
        :class="twMerge(
          'w-1/2 min-w-24 h-full overflow-auto p-2',
          currentView === 'both' && 'grow',
          currentView === 'edit' && 'hidden',
          currentView === 'preview' && 'w-full'
        )"
        data-testid="rendered-markdown"
      >
        <article
          ref="markdownRef"
          class="--markdown"
          v-html="htmlContent"
        />
      </div>
    </div>
  </div>
</template>

<style module>
.menuDropdown {
  @apply right-2;
}

.resize {
  @apply flex flex-col gap-1 items-center justify-center h-full px-[2px] shrink-0 cursor-ew-resize bg-dark-100 dark:bg-dark-700;
}

:global(body.resizing) .resize, .resize:hover {
  @apply bg-dark-200 dark:bg-dark-600;
}
</style>
