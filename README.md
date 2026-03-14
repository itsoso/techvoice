# TechVoice

匿名技术反馈 MVP，包含：

- 员工端匿名吐槽 / 提案提交
- 追踪码查询与匿名补充回复
- 管理员登录、回复、改状态、发布到回音壁
- 公开回音壁列表与 Star
- 多租户“限时匿名会客厅”基础能力
  - 租户管理员登录、审批高管、创建活动
  - 高管实名注册 / 登录 / 接单台
  - 浏览器本地票据抢票、匿名代号、实时会客厅 WebSocket 对话

## Back End

```bash
cd /Users/liqiuhua/work/techvoice/backend
/Users/liqiuhua/work/techvoice/.venv/bin/python -m app.scripts.seed
/Users/liqiuhua/work/techvoice/.venv/bin/python -m uvicorn app.main:app --reload
```

匿名会客厅新增的多租户与活动配置目前通过租户管理员接口维护，默认生产 seed 仍只创建全局管理员账号。

如需正式初始化某个租户和会客厅活动，使用下面的 bootstrap 脚本：

```bash
cd /Users/liqiuhua/work/techvoice/backend
/Users/liqiuhua/work/techvoice/.venv/bin/python -m app.scripts.bootstrap_tenant_lounge \
  --tenant-slug acme \
  --tenant-name "Acme Corp" \
  --admin-username acme-admin \
  --admin-password 'change-me-now' \
  --admin-display-name "Acme Admin" \
  --event-title "Friday Lounge" \
  --event-description "Live anonymous session" \
  --ticket-open-at "2026-03-20T13:30:00+08:00" \
  --start-at "2026-03-20T14:00:00+08:00" \
  --end-at "2026-03-20T15:00:00+08:00" \
  --ticket-limit 5
```

这个脚本是幂等的：
- 相同 `tenant_slug + admin_username` 不会重复创建租户管理员
- 相同 `tenant + event_title + start_at` 不会重复创建活动
- 执行结果会以 JSON 输出，方便在部署脚本里消费

## Front End

```bash
cd /Users/liqiuhua/work/techvoice/frontend
npm install
npm run dev
```

可选环境变量：

- `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`
