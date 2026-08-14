---
name: pm-workflow
description: 产品经理工作流。用于将产品需求转化为 PRD、流程图、时序图、可交互前端原型，并部署为公网可访问链接，最后进行自我评审。当用户说"走产品经理工作流"时触发。适用于 APP、Web 后台、CSP 等 B 端或 C 端需求文档与原型交付。
---

# 产品经理工作流

## Overview

将产品经理与业务方沟通后的需求，按标准流程转化为可交付产物：
1. 结构化的 PRD 文档
2. 流程图与时序图（Mermaid）
3. 可交互前端原型（HTML/CSS/JS）—— 纯净版 + 评审标注版
4. 公网可访问的部署链接
5. 自我评审与方案优化

## When to Use

当用户提出以下类型请求时触发：
- "帮我写个 PRD"
- "画个流程图/时序图"
- "做个可点击原型"
- "把原型发给别人看"
- "评审下这个方案"
- 任何涉及需求文档 + 流程可视化 + 原型验证的场景

## Core Capabilities

### 1. 需求澄清与范围确认

开始任何产出前，先确认以下信息：
- 目标用户是谁？
- 解决什么问题？
- 核心流程有几步？
- 是否有参考图/参考产品/竞品？
- 是否需要多方案对比？
- 是否有必须遵守的设计规范或现有页面风格？

如信息不足，使用 `ask_followup_question` 向用户确认，避免凭空假设。

### 2. 生成 PRD

加载并参考 `references/prd-template.md` 中的结构：
- 背景
- 目标
- 推荐方案
- 数据可行性
- 方案流程
- 时序图
- 页面说明
- 字段规则
- 接口定义
- 异常处理
- 安全策略
- 原型访问

输出要求：
- 文案简洁，避免啰嗦
- 多方案时必须明确推荐方案及理由
- 所有字段必须给出输入方式、字符限制、校验规则
- 接口必须包含路径、参数、返回示例
- 异常场景必须覆盖并给出前端提示

### 3. 生成流程图与时序图

- 流程图使用 Mermaid `flowchart` 或文本流程图
- 时序图使用 Mermaid `sequenceDiagram`
- 严格按原型页面流程绘制，不自行添加未确认的系统角色或服务
- 参与者命名保持简洁，如：用户、前端页面、业务系统
- 必须体现成功与失败两种分支
- 失败分支停留在当前页或返回上一页，并给出提示

### 4. 生成可交互前端原型

以 `assets/prototype-template/` 为起点复制到工作目录：
- 单页多 `section` 切换
- 统一背景与卡片样式
- 输入框不带左侧 icon
- 表单校验、验证码倒计时、Toast 轻提示
- 成功操作后返回入口页并回填关键信息

根据具体需求修改：
- `index.html`：页面结构与字段
- `js/app.js`：页面切换、校验、交互逻辑
- `css/style.css`：颜色、间距、按钮样式

多方案时创建并行文件：
- 方案一：`index.html` + `js/app.js`
- 方案二：`v2.html` + `js/app-v2.js`
- 共用 `css/style.css`

### 5. 生成评审标注版原型

在纯净原型基础上，叠加评审指引层，生成**双版共存**的交付物：

#### 5.1 标注目的

评审标注版用于团队评审、业务方确认或新人培训，通过可视化指引标注页面关键逻辑，帮助非技术干系人理解交互流程。纯净版保留无标注状态，用于交付开发。

#### 5.2 标注元素结构

```html
<!-- 标注层容器，置于外层，不嵌套在卡片内 -->
<div class="annot-layer">
  <!-- 指引气泡：白色气泡 + 箭头，用于步骤说明、关键提示 -->
  <div class="annot annot-right" data-annot-id="xx">
    <span class="annot-label">步骤说明</span><br>
    关键描述<strong class="annot-key">重点词</strong>
  </div>
  <!-- 暗色遮罩标注：灰色半透明区块，用于区域说明 -->
  <div class="annot annot-dim" data-annot-id="yy">
    灰色区块标注文字
  </div>
  <!-- 高亮标注：彩色边框区块，用于重点区域强调 -->
  <div class="annot annot-highlight" data-annot-id="zz">
    重点区域说明
  </div>
</div>
```

#### 5.3 标注类型

| 类型 | CSS 类 | 样式 | 用途 |
|------|--------|------|------|
| 指引气泡 | `.annot` | 白色气泡 + 箭头 | 步骤说明、关键提示 |
| 暗色标注 | `.annot-dim` | 灰色半透明区块 | 区域标注、功能说明 |
| 高亮标注 | `.annot-highlight` | 橙色/蓝色边框区块 | 重点区域强调 |
| 顶部气泡 | `.annot-top` | 气泡在卡片上方 | 顶部位置指引 |
| 右侧气泡 | `.annot-right` | 气泡在卡片右侧 | 避免遮挡按钮交互 |

#### 5.4 标注样式关键规则

```css
/* 标注层不拦截点击事件 */
.annot-layer { z-index: auto; pointer-events: none; }
/* 卡片始终在最上层，保证按钮可点击 */
.card, .step-card { z-index: 51; }
/* 标注本体恢复可交互（拖拽） */
.annot, .annot-dim, .annot-highlight { pointer-events: auto; cursor: grab; }
/* 拖拽中临时提升层级 */
.annot.dragging { z-index: 100; }
```

**核心原则**：标注永远不能遮挡卡片内的按钮或输入框。标注应放在卡片外侧（`left ≥ 385px` 或使用 `.annot-right`）。

#### 5.5 标注拖拽

创建 `js/annot-drag.js`，实现：
- 所有标注元素支持鼠标/触摸拖拽移动
- 拖拽位置自动保存到 `localStorage`（按 `data-annot-id` 为 key）
- 页面刷新后位置自动恢复
- 拖拽过程中临时提升 `z-index: 100`，释放后恢复

#### 5.6 双版分离策略

```
index.html          → 评审标注版（含标注层 + 拖拽 JS）
index-original.html → 纯净版（独立 CSS/JS，无标注）
v2.html             → 评审标注版（方案二）
v2-original.html    → 纯净版（方案二）
```

**关键**：纯净版使用独立的 CSS/JS 文件（如 `style-original.css`、`app-original.js`），避免标注样式污染。可从 git 初始提交提取原始版本，或手动剥离标注代码。

#### 5.7 常见问题

| 问题 | 原因 | 修复 |
|------|------|------|
| 标注遮挡按钮无法点击 | 标注层 `z-index` 压在卡片之上 | 卡片 `z-index: 51`，标注移到卡片外侧 |
| 拖拽标注时误触按钮 | `mousedown` 事件冒泡 | 拖拽开始时提升标注 `z-index` |
| 验证方式无法二选一 | 卡片缺少 `data-method` 属性 | 添加 `data-method="legal"` 等属性 |
| 刷新后标注位置丢失 | 未持久化到 localStorage | 标注拖拽 JS 保存/恢复位置 |

详细标注实现指南见 `references/annotation-guide.md`。

### 6. 部署为公网可访问链接

将原型部署到公网，生成可分享的 URL。首选 **GitHub Pages（Device Flow 授权码方式）**。

#### 6.1 GitHub Pages — Device Flow（推荐首选）

用户无需手动生成 Token，只需在手机/电脑输入一次授权码即可完成部署。

**六步流程**：

```
发起授权请求 → 用户输授权码 → 轮询获取 token → 推送代码 → 开启 Pages → 清理 token
```

| 步骤 | 说明 |
|------|------|
| 发起授权 | `curl POST github.com/login/device/code`，获取 device_code + user_code |
| 用户确认 | 用户在 `github.com/login/device` 输入 user_code 授权 |
| 获取 token | 轮询 `POST login/oauth/access_token`，每 5 秒重试，获取 access_token |
| 推送代码 | 用 token 拼接到 git remote URL 认证推送 |
| 开启 Pages | 通过 API 设置 source branch 为 main |
| 验证+清理 | 确认 200 后立即 `rm` 删除 token 临时文件 |

**安全规则**：
- access_token 存储于 `/tmp/github_token.json`，不输出到用户可见位置
- 部署完成后立即 `rm` 删除临时文件
- device_code 有效期 15 分钟，超时需重新发起

**最终链接**：

```
https://username.github.io/repo-name/                    （评审版-方案一）
https://username.github.io/repo-name/v2.html              （评审版-方案二）
https://username.github.io/repo-name/index-original.html  （纯净版-方案一）
https://username.github.io/repo-name/v2-original.html     （纯净版-方案二）
```

#### 6.2 备用：SSH 方式

当 `github.com` 不可达但 SSH 端口可用时使用。需用户手动添加一次公钥到 GitHub。

#### 6.3 备用：EdgeOne Pages

腾讯云部署，临时 token 链接，适合快速分享。

详细步骤参考 `references/deployment-guide.md`。

### 7. 自我评审

加载并参考 `references/review-checklist.md`，逐项检查：
- 流程是否闭环
- 推荐方案是否明确
- 数据可行性是否说明
- 字段规则是否完整
- 异常场景是否覆盖
- 安全策略是否充分
- 原型与 PRD/时序图是否一致
- 访问链接是否已整理到 PRD

评审后将优化项同步更新到 PRD、原型、时序图，并重新部署原型。

## Resources

### references/prd-template.md
PRD 标准结构模板，包含背景、目标、方案、时序图、字段规则、接口定义、异常处理、安全策略等章节。

### references/review-checklist.md
自我评审检查清单，覆盖需求完整性、方案设计、流程与时序图、页面字段、接口异常、安全策略、原型一致性、可访问性、文案质量、可迭代性。

### references/deployment-guide.md
GitHub Pages（Device Flow 授权码 + SSH 备用）、EdgeOne Pages、打包发送三种部署方式的详细步骤。**Device Flow 为首选方式**——用户无需手动生成 Token，手机输入授权码即可完成部署。

### references/annotation-guide.md
评审标注版原型实现指南，包含标注元素结构、CSS 层级管理、拖拽实现、双版分离策略、常见问题修复记录。

### assets/prototype-template/
前端原型基础模板，包含：
- `index.html`
- `css/style.css`
- `js/app.js`

### assets/annot-drag.js
标注拖拽模块，支持标注元素拖拽移动、localStorage 位置持久化。可直接复制到原型项目的 `js/` 目录使用。

### scripts/deploy-github-pages.sh
自动化部署脚本，将本地原型目录推送到 GitHub Pages 并返回永久访问链接。
