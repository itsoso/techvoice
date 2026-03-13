# TechVoice

匿名技术反馈 MVP，包含：

- 员工端匿名吐槽 / 提案提交
- 追踪码查询与匿名补充回复
- 管理员登录、回复、改状态、发布到回音壁
- 公开回音壁列表与 Star

## Back End

```bash
cd /Users/liqiuhua/work/techvoice/backend
/Users/liqiuhua/work/techvoice/.venv/bin/python -m app.scripts.seed
/Users/liqiuhua/work/techvoice/.venv/bin/python -m uvicorn app.main:app --reload
```

默认管理员账号：

- 用户名：`admin`
- 密码：`admin123456`

## Front End

```bash
cd /Users/liqiuhua/work/techvoice/frontend
npm install
npm run dev
```

可选环境变量：

- `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`
