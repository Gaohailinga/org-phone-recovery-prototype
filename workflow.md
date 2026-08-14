# 原型生成 + 评审标注版工作流

> 适用场景：从 PRD 出发，生成纯净原型（可交付） + 评审标注版原型（含评审指引，用于评审/培训）

## 工作流概览

```
PRD 编写 → 纯净原型生成 → 标注层叠加 → 双版共存 → 部署上线
```

| 阶段 | 产物 | 说明 |
|------|------|------|
| 1. 需求梳理 | PRD.md | 产品需求文档 |
| 2. 时序图 | sequence-diagram.md | 接口交互流程 |
| 3. 纯净原型 | index.html / v2.html | 无标注，可交付开发 |
| 4. 标注叠加 | 同一套 HTML + CSS/JS | 叠加评审指引层 |
| 5. 分离输出 | original / 评审版 | 两套文件并存 |
| 6. 部署 | GitHub Pages | 公网可访问 |

## 阶段详解

### 阶段 1：需求梳理 → PRD

**产出**：`PRD.md`

包含：背景、目标、推荐方案、数据可行性、页面流程、交互说明

### 阶段 2：接口时序图

**产出**：`sequence-diagram.md`

前端 → 网关 → 后端接口调用链路，验证身份 → 换绑手机号 → 继续找回密码

### 阶段 3：生成纯净原型

**产出**：`index.html` + `v2.html` + `css/style.css` + `js/app.js` + `js/app-v2.js`

**要点**：
- 静态 HTML，可直接双击打开
- 支持多方案版本（如双验证 vs 单验证）
- 完整交互逻辑（页面切换、表单验证、步骤流转）
- 深色科技风 UI，卡片式布局

### 阶段 4：叠加评审标注层

在纯净原型基础上，增加以下标注能力：

#### 4.1 HTML 标注元素

```html
<!-- 标注层容器，置于卡片外层 -->
<div class="annot-layer">
  <!-- 指引气泡 -->
  <div class="annot annot-right" data-annot-id="xx">
    <span class="annot-label">步骤说明</span><br>
    关键描述<strong class="annot-key">重点词</strong>
  </div>
  <!-- 暗色遮罩标注 -->
  <div class="annot annot-dim" data-annot-id="yy">
    灰色区块标注文字
  </div>
</div>
```

#### 4.2 标注类型

| 类型 | CSS 类 | 样式 | 用途 |
|------|--------|------|------|
| 指引气泡 | `.annot` | 白色气泡 + 箭头 | 步骤说明、关键提示 |
| 暗色标注 | `.annot-dim` | 灰色半透明区块 | 区域标注、功能说明 |
| 高亮标注 | `.annot-highlight` | 橙色边框区块 | 重点区域强调 |
| 顶部气泡 | `.annot-top` | 气泡在卡片上方 | 顶部位置指引 |
| 右侧气泡 | `.annot-right` | 气泡在卡片右侧 | 避免遮挡交互 |

#### 4.3 标注样式要点

```css
/* 标注层不抢占卡片层级 */
.annot-layer { z-index: auto; pointer-events: none; }
/* 卡片始终在最上层，保证按钮可点击 */
.card { z-index: 51; }
/* 标注可拖拽 */
.annot, .annot-dim, .annot-highlight { cursor: grab; }
/* 拖拽中提升层级临时高于卡片 */
.annot.dragging { z-index: 100; }
```

#### 4.4 标注拖拽（`js/annot-drag.js`）

- 标注整体可拖拽移动
- 位置自动保存到 `localStorage`
- 刷新页面后位置持久化
- 拖拽中临时 `z-index: 100`，不遮挡卡片按钮

### 阶段 5：双版分离

将纯净原型从 git 历史提取，生成独立文件：

```
index.html          → 评审标注版（双验证）
v2.html             → 评审标注版（单验证）
index-original.html → 纯净原型版（双验证）
v2-original.html    → 纯净原型版（单验证）
```

**关键**：原始版使用独立的 CSS/JS（`style-original.css`、`app-original.js`），避免标注样式污染。

### 阶段 6：GitHub Pages 部署

1. SSH 密钥生成并添加到 GitHub
2. `git remote set-url` 切到 SSH
3. `git push` 推送到 `main` 分支
4. GitHub Pages 自动部署（Settings → Pages → main / root）

**最终链接结构**：

| 版本 | URL |
|------|-----|
| 评审版-双验证 | `.../index.html` |
| 评审版-单验证 | `.../v2.html` |
| 纯净版-双验证 | `.../index-original.html` |
| 纯净版-单验证 | `.../v2-original.html` |

## 常见问题与修复记录

### Q1：标注遮挡按钮无法点击
- **原因**：标注层 `z-index: 50` 压在卡片之上
- **修复**：卡片 `z-index: 51`，标注层 `z-index: auto`；标注移到卡片外侧（left ≥ 385px）

### Q2：验证方式全选而非二选一
- **原因**：`verify-card` 缺少 `data-method` 属性
- **修复**：添加 `data-method="legal"` / `data-method="bank"`

### Q3：标注拖拽导致按钮点击失效
- **原因**：`mousedown` 时立即 `e.preventDefault()`，标注 `pointer-events: auto`
- **修复**：标注整体可拖拽，标注移到卡片外侧避免重叠；拖拽时才提升 z-index

## 文件清单

```
workspace/
├── PRD.md                   # 产品需求文档
├── sequence-diagram.md      # 接口时序图
├── workflow.md             # 本工作流文档
├── server.js               # 本地预览服务
│
├── index.html              # 评审版-双验证方式
├── v2.html                 # 评审版-单验证方式
├── index-original.html     # 纯净版-双验证方式
├── v2-original.html        # 纯净版-单验证方式
│
├── css/
│   ├── style.css           # 评审版样式（含标注）
│   └── style-original.css  # 纯净版样式（无标注）
│
└── js/
    ├── app.js              # 双验证逻辑
    ├── app-v2.js           # 单验证逻辑
    ├── annot-drag.js       # 标注拖拽模块
    ├── app-original.js     # 纯净版双验证逻辑
    └── app-v2-original.js  # 纯净版单验证逻辑
```
