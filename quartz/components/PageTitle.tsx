import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <>
      <h2 class={classNames(displayClass, "page-title")}>
        <a href={baseDir}>{title}</a>
      </h2>
      <div class="site-nav-links">
        <a href="/community/">🌐 社区</a>
        <span class="nav-sep">|</span>
        <a href="/community/turtle-run.html">🐢 游戏</a>
      </div>
    </>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}

.site-nav-links {
  margin-top: 0.3rem;
  margin-bottom: 0.8rem;
  font-size: 0.9rem;
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.site-nav-links a {
  color: var(--secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.site-nav-links a:hover {
  color: var(--tertiary);
}

.nav-sep {
  color: var(--lightgray);
  user-select: none;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
