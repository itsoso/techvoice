# 限时匿名会客厅设计文档

## 背景

现有 TechVoice 以“异步匿名留言”为主，适合持续收集问题与提案，但不适合高密度、多轮、强实时的沟通场景。为控制早期运营成本，并验证更高互动强度的沟通模式，需要新增“限时匿名会客厅”活动模式。

该模式目标是：

- 在固定时间窗口内，用小流量、强实时的方式组织匿名对话
- 通过限量抢票控制参与规模与管理员精力消耗
- 让管理员授权后的高管或 HR 在活动期间实时接单、快速深挖问题
- 保持员工匿名，不接企业身份系统，先用浏览器本地票据验证模式

## 已确认范围

- `1 个 tenant = 1 个公司/客户实例`
- 活动模式按 `tenant` 做数据隔离
- 抢票与入场资格 `暂不绑定真实员工身份`
- 员工侧按 `浏览器本地票据 + 短期入场 token` 进入活动
- 实时对话采用 `WebSocket`
- 会话采用 `公共待接单池`，由在线高管自行接单
- `1 位高管` 在同一场活动中 `允许同时接多个匿名会话`
- 高管/HR 必须 `实名注册`，并由 `租户管理员审批授权` 后才能接单
- 现有异步反馈链路保留，活动模式作为新增能力并存
- tenant 入口采用 `路径型租户 URL`

## 设计目标

### 业务目标

- 提供低配额、高互动密度的匿名实时沟通模式
- 验证员工对“限时抢票 + 实时接单”的参与意愿
- 验证高管侧是否能在低运营成本下高质量处理实时匿名对话

### 工程目标

- 在现有单机 `FastAPI + SQLite + Nginx + React` 体系内落地 MVP
- 不引入 Redis、消息队列等新基础设施
- 保持现有异步留言链路可用，不影响已上线能力
- 从第一天开始为多租户建模，但实现优先单租户可跑通

## 方案选择

### 方案 1：单体 FastAPI + WebSocket + SQLite 扩表

在现有单体服务内新增活动相关模型、HTTP API 和 WebSocket 端点，在线连接状态保存在单进程内存，会话和消息状态实时落库。

优点：

- 与当前部署方式兼容，落地成本最低
- 适合小流量 MVP
- 不引入额外基础设施

缺点：

- 多实例扩容前，需要补 Redis 协调在线状态和广播

### 方案 2：FastAPI + Redis 协调层

引入 Redis 存储在线状态、待接单池、广播协调。

优点：

- 更接近正式生产形态
- 多实例更容易扩展

缺点：

- 当前成本过高
- 会增加部署和运维复杂度

### 方案 3：独立活动子系统

将匿名会客厅作为独立服务。

优点：

- 边界清晰
- 未来演进空间大

缺点：

- 对当前 MVP 明显过重

### 结论

采用 `方案 1`。先在现有单体内完成 MVP，优先验证业务模式，而不是追求最终架构形态。

## 系统边界与角色模型

### tenant

- 一个 tenant 表示一个公司或客户实例
- 所有活动、高管、管理员、票据、会话、消息都必须归属 tenant
- 任意 tenant 之间数据完全隔离

### 角色

#### tenant_admin

- 创建和管理活动
- 审批高管身份
- 查看活动归档和会话记录

#### executive

- 实名注册
- 通过租户管理员审批后，才可登录接单台
- 可同时接多个匿名会话

#### anonymous_participant

- 不登记真实身份
- 抢票成功后，依赖当前浏览器里保存的本地票据和短期入场 token 参与活动
- 在活动中只展示匿名代号

## 核心数据模型

在现有 `admins / feedbacks / feedback_events / stars` 之外，新增以下表。

### tenants

- `id`
- `slug`
- `name`
- `status`
- `created_at`

作用：租户根对象，所有活动链路通过它进行隔离。

### tenant_admins

- `id`
- `tenant_id`
- `username`
- `password_hash`
- `display_name`
- `is_active`
- `created_at`

作用：租户管理员登录和权限控制。

### executives

- `id`
- `tenant_id`
- `name`
- `email`
- `title`
- `password_hash`
- `approval_status`
- `is_active`
- `created_at`

作用：实名注册的高管或 HR 用户，只有 `approved` 才允许接单。

### lounge_events

- `id`
- `tenant_id`
- `title`
- `description`
- `ticket_open_at`
- `start_at`
- `end_at`
- `ticket_limit`
- `status`
- `created_by_admin_id`
- `created_at`

作用：定义某场限时匿名会客厅活动。

### lounge_tickets

- `id`
- `event_id`
- `ticket_code`
- `client_fingerprint`
- `entry_token_hash`
- `alias_label`
- `claimed_at`
- `entered_at`
- `status`

作用：记录匿名用户的抢票结果和入场资格。

### lounge_sessions

- `id`
- `event_id`
- `ticket_id`
- `executive_id`
- `status`
- `claimed_by_executive_at`
- `closed_at`

作用：表示高管与匿名用户之间的一对一会话。

### lounge_messages

- `id`
- `session_id`
- `sender_type`
- `sender_label`
- `content`
- `created_at`

作用：保存聊天记录，活动结束后归档。

## 核心业务流程

### 1. 管理员创建活动

管理员为某个 tenant 创建活动，配置：

- 抢票开放时间
- 正式开始时间
- 结束时间
- 名额上限
- 活动文案

### 2. 员工抢票

在允许抢票的时间窗口内，匿名用户可进入抢票页。系统校验：

- 当前 tenant 下存在可抢票活动
- 当前时间已到抢票开放时间
- 票数未满
- 当前浏览器尚未为该活动持有有效票据

成功后返回：

- `ticket_code`
- `entry_token`
- `alias_label`

这些信息只保存在浏览器 `localStorage` 中，不写入任何真实员工身份。

### 3. 员工进场

活动开始后，匿名用户携带本地票据进入会客厅。服务端校验：

- 活动已开始且未结束
- 票据有效
- `entry_token` 与服务端哈希匹配

校验通过后，用户进入 `公共待接单池`。

### 4. 高管登录并接单

高管完成实名注册后，由租户管理员审批授权。被授权后可登录高管后台，查看：

- 当前活动信息
- 待接单用户列表
- 自己正在进行中的多个会话

高管点击某个待接单用户后，系统创建或认领 `lounge_session`。

### 5. WebSocket 多轮对话

匿名用户和高管基于 `session_id` 进入实时聊天通道：

- 支持双方多轮消息
- 支持高管并发处理多个会话
- 所有消息实时落库

### 6. 活动结束与归档

一旦到达活动结束时间：

- 不允许新用户进场
- 待接单池中尚未被接单的用户自动失效
- 已开始会话转为只读并关闭
- 消息归档，可在管理员后台查看

## URL 设计

tenant 采用路径型租户入口：

- `/t/:tenantSlug`
- `/t/:tenantSlug/lounge`
- `/t/:tenantSlug/lounge/:eventId/ticket`
- `/t/:tenantSlug/lounge/:eventId/room`
- `/t/:tenantSlug/executive/register`
- `/t/:tenantSlug/executive/login`
- `/t/:tenantSlug/executive/lounge`
- `/t/:tenantSlug/admin/login`
- `/t/:tenantSlug/admin/lounge-events`
- `/t/:tenantSlug/admin/lounge-events/:eventId`
- `/t/:tenantSlug/admin/executives`

## API 设计

### 员工侧

- `GET /api/v1/tenants/{tenant_slug}/lounge-events/current`
- `POST /api/v1/tenants/{tenant_slug}/lounge-events/{event_id}/claim-ticket`
- `POST /api/v1/tenants/{tenant_slug}/lounge-events/{event_id}/enter`

### 高管侧

- `POST /api/v1/tenants/{tenant_slug}/executives/register`
- `POST /api/v1/tenants/{tenant_slug}/executives/login`
- `GET /api/v1/tenants/{tenant_slug}/executive/lounge-queue`
- `POST /api/v1/tenants/{tenant_slug}/executive/lounge-sessions/{session_id}/claim`

### 管理员侧

- `POST /api/v1/tenants/{tenant_slug}/admin/lounge-events`
- `GET /api/v1/tenants/{tenant_slug}/admin/lounge-events`
- `GET /api/v1/tenants/{tenant_slug}/admin/lounge-events/{event_id}`
- `POST /api/v1/tenants/{tenant_slug}/admin/executives/{executive_id}/approve`
- `POST /api/v1/tenants/{tenant_slug}/admin/executives/{executive_id}/reject`

## WebSocket 设计

### 匿名用户连接

- `ws /api/v1/ws/tenants/{tenant_slug}/lounge-events/{event_id}/participant?entry_token=...`

### 高管工作台连接

- `ws /api/v1/ws/tenants/{tenant_slug}/executive/lounge?access_token=...`

### 事件类型

- `queue_joined`
- `session_claimed`
- `message_sent`
- `session_closed`
- `event_closed`

### MVP 约束

- 在线连接映射保存在单进程内存
- 会话状态与聊天消息实时落库
- 不引入 Redis

## UI 范围

### 员工端

- 活动大厅
- 抢票页
- 会客厅房间页

### 高管端

- 注册页
- 登录页
- 接单台

### 管理员端

- 活动列表/创建页
- 活动详情与归档页
- 高管审批页

### 架构页补充

本次迭代还需要修正 `/architecture` 的代码快照统计口径，改为展示：

- 生产代码
- 测试代码
- 文档与静态资源

并按当前仓库重新精确统计，不再使用旧的静态数字。

## 关键约束

- 匿名员工不绑定真实身份
- 高管必须实名并经授权
- 同一浏览器同一活动只允许持有 1 张有效票据
- 同一匿名用户会话只能被 1 位高管认领
- 高管允许同时持有多个进行中会话
- tenant 之间不允许任何越权访问

## 错误处理

- 票数已满：返回明确提示
- 活动未开始或已结束：拒绝抢票/入场/发消息
- 高管未授权：登录后只展示审批中状态，不允许进入接单台
- 票据失效或浏览器丢失本地票据：提示无法恢复，需要重新参与下一场活动

## 测试策略

### 后端

- 租户隔离
- 抢票上限
- 本地票据入场
- 高管审批与登录
- 会话认领
- WebSocket 消息收发
- 活动结束自动关闭

### 前端

- 抢票成功后本地票据保存
- 活动大厅状态展示
- 高管接单池渲染与认领
- 会话消息流和关闭态
- 管理员活动管理与高管审批

### 联调

- 默认 seed 一个 tenant
- 默认 seed 一个活动
- 默认 seed 一名租户管理员
- 默认 seed 两名已授权高管

## 分阶段实施建议

第一阶段：

- 建模与 API
- 抢票与入场
- 高管注册与审批
- 待接单池

第二阶段：

- WebSocket 聊天
- 会话归档
- 管理端活动详情与归档

第三阶段：

- 首页活动入口联动
- 架构页准确统计
- 体验打磨与可视化状态提示
