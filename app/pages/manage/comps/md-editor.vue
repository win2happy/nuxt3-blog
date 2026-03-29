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

  // 注册代码补全提供程序
  const { languages } = await import("monaco-editor");

  // 确保编辑器选项启用了代码补全
  editor.updateOptions({
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    suggestFontSize: 14,
    suggestLineHeight: 20
  });

  const completionProvider = languages.registerCompletionItemProvider("markdown", {
    triggerCharacters: ["/"],
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const lastSlashIndex = textUntilPosition.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        return { suggestions: [] };
      }

      // 确保斜杠是行的第一个非空白字符或前面有空格
      const textBeforeSlash = textUntilPosition.substring(0, lastSlashIndex);
      if (textBeforeSlash.trim() !== "" && !textBeforeSlash.endsWith(" ")) {
        return { suggestions: [] };
      }

      const triggerText = textUntilPosition.substring(lastSlashIndex + 1);

      // 定义所有可用的快捷键
      const allSuggestions = [
        // 标题
        { label: "h1", kind: languages.CompletionItemKind.Keyword, insertText: "# 一级标题\n", detail: "插入一级标题", documentation: "# 一级标题" },
        { label: "h2", kind: languages.CompletionItemKind.Keyword, insertText: "## 二级标题\n", detail: "插入二级标题", documentation: "## 二级标题" },
        { label: "h3", kind: languages.CompletionItemKind.Keyword, insertText: "### 三级标题\n", detail: "插入三级标题", documentation: "### 三级标题" },
        { label: "h4", kind: languages.CompletionItemKind.Keyword, insertText: "#### 四级标题\n", detail: "插入四级标题", documentation: "#### 四级标题" },
        { label: "h5", kind: languages.CompletionItemKind.Keyword, insertText: "##### 五级标题\n", detail: "插入五级标题", documentation: "##### 五级标题" },
        { label: "h6", kind: languages.CompletionItemKind.Keyword, insertText: "###### 六级标题\n", detail: "插入六级标题", documentation: "###### 六级标题" },

        // 文本格式化
        { label: "bold", kind: languages.CompletionItemKind.Keyword, insertText: "**粗体文本**", detail: "插入粗体文本", documentation: "**粗体文本**" },
        { label: "italic", kind: languages.CompletionItemKind.Keyword, insertText: "*斜体文本*", detail: "插入斜体文本", documentation: "*斜体文本*" },
        { label: "strikethrough", kind: languages.CompletionItemKind.Keyword, insertText: "~~删除线文本~~", detail: "插入删除线文本", documentation: "~~删除线文本~~" },
        { label: "underline", kind: languages.CompletionItemKind.Keyword, insertText: "_(下划线文本)_", detail: "插入下划线文本", documentation: "_(下划线文本)_" },
        { label: "color", kind: languages.CompletionItemKind.Keyword, insertText: "-(#ff0000: 彩色文本)-", detail: "插入彩色文本", documentation: "-(#ff0000: 彩色文本)-" },

        // 链接和图片
        { label: "link", kind: languages.CompletionItemKind.Function, insertText: "#[链接文本](https://example.com)", detail: "插入链接", documentation: "#[链接文本](https://example.com)" },
        { label: "image", kind: languages.CompletionItemKind.Function, insertText: "![图片描述](图片链接)", detail: "插入图片", documentation: "![图片描述](图片链接)" },

        // 代码
        { label: "code", kind: languages.CompletionItemKind.Function, insertText: "```javascript\n// 代码\n```", detail: "插入代码块", documentation: "```javascript\n// 代码\n```" },
        { label: "inlinecode", kind: languages.CompletionItemKind.Function, insertText: "`行内代码`", detail: "插入行内代码", documentation: "`行内代码`" },

        // 列表
        { label: "ul", kind: languages.CompletionItemKind.Keyword, insertText: "- 无序列表项\n- 无序列表项\n", detail: "插入无序列表", documentation: "- 无序列表项\n- 无序列表项" },
        { label: "ol", kind: languages.CompletionItemKind.Keyword, insertText: "1. 有序列表项\n2. 有序列表项\n", detail: "插入有序列表", documentation: "1. 有序列表项\n2. 有序列表项" },
        { label: "task", kind: languages.CompletionItemKind.Keyword, insertText: "- [x] 已完成任务\n- [ ] 未完成任务\n", detail: "插入任务列表", documentation: "- [x] 已完成任务\n- [ ] 未完成任务" },

        // 引用和表格
        { label: "quote", kind: languages.CompletionItemKind.Keyword, insertText: "> 引用文本\n", detail: "插入引用", documentation: "> 引用文本" },
        { label: "table", kind: languages.CompletionItemKind.Keyword, insertText: "| 表头1 | 表头2 |\n| ---- | ---- |\n| 单元格1 | 单元格2 |\n", detail: "插入表格", documentation: "| 表头1 | 表头2 |\n| ---- | ---- |\n| 单元格1 | 单元格2 |" },

        // 数学公式
        { label: "math", kind: languages.CompletionItemKind.Function, insertText: "$$数学公式$$", detail: "插入数学公式", documentation: "$$数学公式$$" },
        { label: "mathblock", kind: languages.CompletionItemKind.Function, insertText: "$$\n数学公式\n$$", detail: "插入块级数学公式", documentation: "$$\n数学公式\n$$" },

        // 媒体
        { label: "youtube", kind: languages.CompletionItemKind.Function, insertText: "[youtube][视频标题](https://www.youtube.com/embed/视频ID)", detail: "插入YouTube视频", documentation: "[youtube][视频标题](https://www.youtube.com/embed/视频ID)" },
        { label: "bili", kind: languages.CompletionItemKind.Function, insertText: "[bili][视频标题](https://player.bilibili.com/player.html?aid=视频ID)", detail: "插入B站视频", documentation: "[bili][视频标题](https://player.bilibili.com/player.html?aid=视频ID)" },
        { label: "video", kind: languages.CompletionItemKind.Function, insertText: "[video][视频标题](海报链接|视频链接)", detail: "插入视频", documentation: "[video][视频标题](海报链接|视频链接)" },
        { label: "audio", kind: languages.CompletionItemKind.Function, insertText: "[audio][音频标题](音频链接)", detail: "插入音频", documentation: "[audio][音频标题](音频链接)" },

        // 容器
        { label: "info", kind: languages.CompletionItemKind.Function, insertText: "::: info\n信息内容\n:::", detail: "插入信息容器", documentation: "::: info\n信息内容\n:::" },
        { label: "tip", kind: languages.CompletionItemKind.Function, insertText: "::: tip\n提示内容\n:::", detail: "插入提示容器", documentation: "::: tip\n提示内容\n:::" },
        { label: "warning", kind: languages.CompletionItemKind.Function, insertText: "::: warning\n警告内容\n:::", detail: "插入警告容器", documentation: "::: warning\n警告内容\n:::" },
        { label: "danger", kind: languages.CompletionItemKind.Function, insertText: "::: danger\n危险内容\n:::", detail: "插入危险容器", documentation: "::: danger\n危险内容\n:::" },
        { label: "details", kind: languages.CompletionItemKind.Function, insertText: "::: details 详情标题\n详情内容\n:::", detail: "插入详情容器", documentation: "::: details 详情标题\n详情内容\n:::" },

        // 其他
        { label: "encrypt", kind: languages.CompletionItemKind.Function, insertText: "[encrypt]\n加密内容\n[/encrypt]", detail: "插入加密块", documentation: "[encrypt]\n加密内容\n[/encrypt]" },
        { label: "html", kind: languages.CompletionItemKind.Function, insertText: "[html]\n<div>HTML内容</div>\n[/html]", detail: "插入原始HTML", documentation: "[html]\n<div>HTML内容</div>\n[/html]" },
        { label: "fieldset", kind: languages.CompletionItemKind.Function, insertText: "--字段集标题--\n字段集内容\n-- --", detail: "插入字段集", documentation: "--字段集标题--\n字段集内容\n-- --" },
        { label: "sticker", kind: languages.CompletionItemKind.Function, insertText: "![sticker](sticker/yellow-face/18)", detail: "插入贴纸", documentation: "![sticker](sticker/yellow-face/18)" }
      ];

      // 过滤匹配的建议
      const filteredSuggestions = allSuggestions.filter(suggestion =>
        suggestion.label.toLowerCase().startsWith(triggerText.toLowerCase())
        || suggestion.detail.toLowerCase().includes(triggerText.toLowerCase())
      );

      return {
        suggestions: filteredSuggestions.map(suggestion => ({
          ...suggestion,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: lastSlashIndex + 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          }
        }))
      };
    }
  });

  // 保存注册的提供程序，以便在组件卸载时注销
  destroyFns.push(() => {
    completionProvider.dispose();
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
          'w-1/2 min-w-24 h-full',
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
