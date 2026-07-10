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
        const emojiMap: Record<string, string> = {
          "物理纵深": "🔬",
          "密码与分布式": "🔐",
          "弈理观世": "♟️",
          "文本深读": "📖",
          "关于本站": "ℹ️",
          "量子视界": "⚛️",
          "弦论与高维空间": "🌀",
          "前沿物理随笔": "💡",
          "区块链原理": "⛓️",
          "密码学与博弈": "🔑",
          "系统规则札记": "📋",
          "围棋弈理": "🎯",
          "规则博弈随笔": "🎲",
          "公案禅思": "🧘",
          "文本精读": "📚",
          "人物思辨": "🎭",
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
          "物理纵深": "🔬",
          "密码与分布式": "🔐",
          "弈理观世": "♟️",
          "文本深读": "📖",
          "关于本站": "ℹ️",
          "量子视界": "⚛️",
          "弦论与高维空间": "🌀",
          "前沿物理随笔": "💡",
          "区块链原理": "⛓️",
          "密码学与博弈": "🔑",
          "系统规则札记": "📋",
          "围棋弈理": "🎯",
          "规则博弈随笔": "🎲",
          "公案禅思": "🧘",
          "文本精读": "📚",
          "人物思辨": "🎭",
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
