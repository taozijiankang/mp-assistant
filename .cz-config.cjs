module.exports = {
  types: [
    { value: "feat", name: "feat: 新功能" },
    { value: "fix", name: "fix: 修复bug" },
    { value: "docs", name: "docs: 文档变更" },
    { value: "style", name: "style: 代码格式（不影响代码运行的变动）" },
    { value: "optimize", name: "optimize: 优化" },
    {
      value: "refactor",
      name: "refactor: 重构（既不是新增功能，也不是修复bug的代码变动）"
    },
    { value: "perf", name: "perf: 性能优化" },
    { value: "test", name: "test: 增加测试" },
    {
      value: "chore",
      name: "chore: 其他修改"
    },
    { value: "revert", name: "revert: 回滚" },
    { value: "build", name: "build: 打包" }
  ],
  scopes: [
    { value: "", name: "empty: 空" },
    { value: "all", name: "all: 全部" },
    { value: "background", name: "background: 后台脚本" },
    { value: "common", name: "common: 公共模块" },
    { value: "config", name: "config: 配置相关" },
    { value: "extensions", name: "extensions: 扩展相关" },
    { value: "inject", name: "inject: 注入脚本" },
    { value: "pages", name: "pages: 页面相关" },
    { value: "scripts", name: "scripts: 脚本相关" },
    { value: "shared", name: "shared: 共享模块" },
    { value: "other", name: "other: 其他" },
    { value: "release-content", name: "release-content: 发布内容" }
  ],
  messages: {
    type: "选择提交类型:",
    scope: "选择影响范围（可选）:",
    subject: "简短描述（必填）:",
    body: "详细描述（可选，使用 '|' 换行）:",
    breaking: "破坏性变更说明（可选）:",
    footer: "关联的 issue（可选，例如: Closes #123）:",
    confirmCommit: "确认提交?"
  },
  subjectLimit: 100,
  skipQuestions: ["breaking", "footer"]
};
