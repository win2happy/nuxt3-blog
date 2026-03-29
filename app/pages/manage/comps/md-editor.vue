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

// 定义智能提示项
const suggestionItems = [
  // 标题
  { label: "h1 一级标题", insertText: "# 一级标题\n", kind: 17, detail: "快捷键: h1" },
  { label: "h2 二级标题", insertText: "## 二级标题\n", kind: 17, detail: "快捷键: h2" },
  { label: "h3 三级标题", insertText: "### 三级标题\n", kind: 17, detail: "快捷键: h3" },
  { label: "h4 四级标题", insertText: "#### 四级标题\n", kind: 17, detail: "快捷键: h4" },
  { label: "h5 五级标题", insertText: "##### 五级标题\n", kind: 17, detail: "快捷键: h5" },
  { label: "h6 六级标题", insertText: "###### 六级标题\n", kind: 17, detail: "快捷键: h6" },

  // 文本格式化
  { label: "bold 粗体", insertText: "**粗体文本**", kind: 14, detail: "快捷键: bold" },
  { label: "italic 斜体", insertText: "*斜体文本*", kind: 14, detail: "快捷键: italic" },
  { label: "strikethrough 删除线", insertText: "~~删除线文本~~", kind: 14, detail: "快捷键: strikethrough" },
  { label: "underline 下划线", insertText: "_(下划线文本)_", kind: 14, detail: "快捷键: underline" },
  { label: "color 彩色文本", insertText: "-(#ff0000: 彩色文本)-", kind: 14, detail: "快捷键: color" },

  // 链接和图片
  { label: "link 链接", insertText: "#[链接文本](https://example.com)", kind: 10, detail: "快捷键: link" },
  { label: "image 图片", insertText: "![图片描述](图片链接)", kind: 10, detail: "快捷键: image" },

  // 代码
  { label: "code 代码块", insertText: "```javascript\n// 代码\n```", kind: 1, detail: "快捷键: code" },
  { label: "inlinecode 行内代码", insertText: "`行内代码`", kind: 1, detail: "快捷键: inlinecode" },

  // 列表
  { label: "ul 无序列表", insertText: "- 无序列表项\n- 无序列表项\n", kind: 12, detail: "快捷键: ul" },
  { label: "ol 有序列表", insertText: "1. 有序列表项\n2. 有序列表项\n", kind: 12, detail: "快捷键: ol" },
  { label: "task 任务列表", insertText: "- [x] 已完成任务\n- [ ] 未完成任务\n", kind: 12, detail: "快捷键: task" },

  // 引用和表格
  { label: "quote 引用", insertText: "> 引用文本\n", kind: 13, detail: "快捷键: quote" },
  { label: "table 表格", insertText: "| 表头1 | 表头2 |\n| ---- | ---- |\n| 单元格1 | 单元格2 |\n", kind: 9, detail: "快捷键: table" },

  // 数学公式
  { label: "math 数学公式", insertText: "$$数学公式$$", kind: 1, detail: "快捷键: math" },
  { label: "mathblock 块级数学公式", insertText: "$$\n数学公式\n$$", kind: 1, detail: "快捷键: mathblock" },

  // 媒体
  { label: "youtube YouTube视频", insertText: "[youtube][视频标题](https://www.youtube.com/embed/视频ID)", kind: 10, detail: "快捷键: youtube" },
  { label: "bili B站视频", insertText: "[bili][视频标题](https://player.bilibili.com/player.html?aid=视频ID)", kind: 10, detail: "快捷键: bili" },
  { label: "video 视频", insertText: "[video][视频标题](海报链接|视频链接)", kind: 10, detail: "快捷键: video" },
  { label: "audio 音频", insertText: "[audio][音频标题](音频链接)", kind: 10, detail: "快捷键: audio" },

  // 容器
  { label: "info 信息容器", insertText: "::: info\n信息内容\n:::", kind: 23, detail: "快捷键: info" },
  { label: "tip 提示容器", insertText: "::: tip\n提示内容\n:::", kind: 23, detail: "快捷键: tip" },
  { label: "warning 警告容器", insertText: "::: warning\n警告内容\n:::", kind: 23, detail: "快捷键: warning" },
  { label: "danger 危险容器", insertText: "::: danger\n危险内容\n:::", kind: 23, detail: "快捷键: danger" },
  { label: "details 详情容器", insertText: "::: details 详情标题\n详情内容\n:::", kind: 23, detail: "快捷键: details" },

  // 其他
  { label: "encrypt 加密块", insertText: "[encrypt]\n加密内容\n[/encrypt]", kind: 23, detail: "快捷键: encrypt" },
  { label: "html 原始HTML", insertText: "[html]\n<div>HTML内容</div>\n[/html]", kind: 1, detail: "快捷键: html" },
  { label: "fieldset 字段集", insertText: "--字段集标题--\n字段集内容\n-- --", kind: 23, detail: "快捷键: fieldset" },
  { label: "sticker 贴纸", insertText: "![sticker](sticker/yellow-face/18)", kind: 10, detail: "快捷键: sticker" }
];

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

  // 注册代码补全提供者
  const { languages } = module;
  languages.registerCompletionItemProvider("markdown", {
    triggerCharacters: ["/"],
    provideCompletionItems: (model, position) => {
      const textBeforeCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const slashIndex = textBeforeCursor.lastIndexOf("/");
      if (slashIndex !== -1) {
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: slashIndex + 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        };

        const completions = suggestionItems.map(item => ({
          label: item.label,
          kind: item.kind,
          detail: item.detail,
          insertText: item.insertText,
          range: range
        }));
        return {
          suggestions: completions
        };
      }
      return { suggestions: [] };
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
