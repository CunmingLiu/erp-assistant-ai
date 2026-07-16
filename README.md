# ERP 助手后端

独立 NestJS + TypeScript 项目，提供 ERP 只读网关、模型 Tool Calling 和 SSE 聊天 API。

在仓库根目录完成 `pnpm install` 后，复制 `.env.example` 为 `.env`，再单独运行：

```bash
pnpm --dir backend dev
pnpm --dir backend test
pnpm --dir backend build
pnpm --dir backend start
```

`/api/health` 不依赖 ERP 或模型配置。ERP Token、模型 Key 和工具开关只允许放在本目录 `.env` 或服务端部署环境中。
