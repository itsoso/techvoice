# TechVoice Architecture Page And Theme Design

**Date:** 2026-03-13

## Goal

为所有访客新增一个公开可见的“架构说明”页面，并为整个站点增加白天 / 黑夜 / 跟随系统三种主题模式。

## Scope

- 主导航新增 `架构说明` 菜单
- 新增公开路由 `/architecture`
- 页面展示整体架构说明、模块划分、功能点、数据结构概览、代码行数快照
- 全站支持 `浅色 / 深色 / 跟随系统`
- 记住用户显式选择，并在未选择时跟随系统明暗模式

## Non-Goals

- 不做服务端实时统计代码行数
- 不做管理员专属架构页
- 不调整现有 API 业务逻辑
- 不重构现有页面结构，只改全局主题变量和通用导航

## Current State

当前前端是 React + Vite + TypeScript 单页应用，导航入口集中在 `frontend/src/components/SiteChrome.tsx`，路由集中在 `frontend/src/App.tsx`。整体视觉样式主要由 `frontend/src/styles.css` 中的深色 CSS 变量驱动。

当前版本代码统计快照如下，统计口径只包含源码文件，不含 `node_modules`、`dist`、`.git`、`.venv`、`__pycache__`：

- 前端源码：2519 行
- 后端应用：1250 行
- 后端测试：335 行
- 合计：4104 行

## Architecture Page Design

### Route And Navigation

- 新增路由：`/architecture`
- 主导航新增菜单：`架构说明`
- 面包屑：`首页 / 架构说明`
- 页面对所有访客开放，不需要登录

### Page Content Structure

页面结构保持与现有站点一致，沿用 `page-shell + hero-panel + entry-card/detail-card` 的视觉语言。内容分为以下区块：

1. 顶部说明区
   - 页面标题：`整体网站架构说明`
   - 副标题：说明这是当前部署版本的公开技术概览

2. 架构总览区
   - 前端：React、Vite、React Router、CSS 变量主题体系
   - 后端：FastAPI、SQLAlchemy、Pydantic、SQLite
   - 部署：Nginx 反向代理、systemd 服务、静态资源目录

3. 页面与模块区
   - 员工端：首页、吐槽提交、提案提交、成功页、追踪查询
   - 公开页：回音壁、架构说明
   - 管理端：登录、反馈看板、反馈详情、公开墙管理

4. 功能点区
   - 匿名吐槽提交
   - 结构化提案提交
   - 追踪码查询
   - 匿名补充回复
   - 管理员回复与状态流转
   - 公开到回音壁
   - 回音壁点赞
   - 敏感词校验与匿名约束

5. 数据与接口区
   - 核心表：`admins`、`feedbacks`、`feedback_events`、`stars`
   - 核心 API：员工提交、追踪查询、管理员操作、公开回音壁

6. 代码统计区
   - 展示当前版本的静态快照
   - 明确说明这不是页面实时扫描结果

## Theme System Design

### Theme Modes

- `system`
- `light`
- `dark`

### Source Of Truth

- `localStorage` key 保存用户偏好：`techvoice-theme-preference`
- 允许值：`system | light | dark`
- 有显式选择时优先使用本地值
- 无显式选择时，使用 `window.matchMedia("(prefers-color-scheme: dark)")`

### DOM Strategy

- 在 `document.documentElement` 上挂载：
  - `data-theme="light" | "dark"`
- `system` 模式下，运行时解析成实际主题并写入 `data-theme`

### Anti-Flash Strategy

- 在前端挂载前执行一个很小的初始化逻辑，先把 `data-theme` 写到 `document.documentElement`
- 这样首次渲染时就带正确主题，避免白屏闪烁或先黑后白

### Theme Switcher UI

- 放在顶部导航右侧
- 使用轻量 segmented control / pills 样式
- 提供三个选项：
  - `跟随系统`
  - `浅色`
  - `深色`
- 任一页面切换后全站立即生效

## Styling Strategy

当前站点颜色基本都来自 `styles.css` 顶部变量，因此本次不改页面布局，直接扩展为两套变量：

- 默认深色变量：保留现有视觉方向
- 浅色变量：补一套更亮的背景、面板、文字、边框、阴影值

重点保证以下元素在浅色主题下仍然清晰：

- 顶部导航
- hero panel
- 表单面板
- 时间线
- 回音壁卡片
- 按钮、错误提示、面包屑、状态标签

## Data Source For Architecture Content

架构说明页使用静态内容常量，不在浏览器端扫描文件系统。原因：

- 线上前端无法直接访问源码文件
- 静态内容可控、稳定、易维护
- 当前需求是展示“当前版本说明”，不是做代码浏览器

代码行数也用当前统计快照常量展示，并在页面中标注统计口径。

## Testing Strategy

### Frontend

- 为主导航增加新菜单的测试
- 为架构说明页增加渲染测试
- 为主题切换增加测试：
  - 默认跟随系统
  - 手动切换并写入 localStorage
  - 页面初次渲染时使用持久化主题

### Verification

- `npm test`
- `npm run build`
- 手动检查首页、架构页、提交页、管理员页在浅色 / 深色下都能正确显示

## Implementation Notes

- 优先保持现有页面结构不变
- 通过新增主题工具和公共页面，把改动收敛到：
  - `App.tsx`
  - `SiteChrome.tsx`
  - `styles.css`
  - 新的 `ArchitecturePage.tsx`
  - 新的主题工具文件和测试
