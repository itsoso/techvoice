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

默认管理员账号：

- 用户名：`admin`
- 密码：`admin123456`

匿名会客厅新增的多租户与活动配置目前通过租户管理员接口维护，默认生产 seed 仍只创建全局管理员账号。

## Front End

```bash
cd /Users/liqiuhua/work/techvoice/frontend
npm install
npm run dev
```

可选环境变量：

- `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`
