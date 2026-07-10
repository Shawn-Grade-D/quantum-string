import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      title: "📂 导航",
      folderDefaultState: "open",
      mapFn: (node) => {
        const slug = node.slug ?? node.displayName
        // 顶级栏目加 emoji 图标
        const emojiMap: Record<string, string> = {
          "认知思辨": "🧠",
          "弈理观世": "♟️",
          "文本深读": "📖",
          "公案禅思": "🧘",
          "人间札记": "✍️",
          "posts": "📡",
        }
        const key = node.displayName
        if (emojiMap[key]) {
          node.displayName = `${emojiMap[key]} ${key}`
        }
        return node
      },
    }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      title: "📂 导航",
      folderDefaultState: "open",
      mapFn: (node) => {
        const emojiMap: Record<string, string> = {
          "认知思辨": "🧠",
          "弈理观世": "♟️",
          "文本深读": "📖",
          "公案禅思": "🧘",
          "人间札记": "✍️",
          "posts": "📡",
        }
        const key = node.displayName
        if (emojiMap[key]) {
          node.displayName = `${emojiMap[key]} ${key}`
        }
        return node
      },
    }),
  ],
  right: [],
}
