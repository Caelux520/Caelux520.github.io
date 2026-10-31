// 本地类型声明：markdown-it-container 没有官方类型定义。
// 声明其默认导出是一个 markdown-it 插件（md.use(plugin, name, options)）。

declare module "markdown-it-container" {
  import type MarkdownIt from "markdown-it";

  export interface ContainerOptions {
    /** 校验开头的 `::: name` 行格式 */
    validate?(params: string): boolean;
    /** 渲染容器开闭标签 */
    render?(
      tokens: any[],
      idx: number,
      options?: any,
      env?: any,
      self?: any,
    ): string;
    /** 覆盖默认标记字符（默认 `:`） */
    marker?: string;
  }

  /** markdown-it-container 插件 */
  function container(
    md: MarkdownIt,
    name: string,
    options?: ContainerOptions,
  ): void;

  export default container;
}
