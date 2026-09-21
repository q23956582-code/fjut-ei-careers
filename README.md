# 福建理工大学电气与信息工程学院就业日历

面向本院学生的招聘活动聚合站。学生无需登录即可浏览，管理员通过 GitHub Issue 提交信息，审核 Pull Request 后发布。

## 本地运行

```bash
npm install
npm run dev
```

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 信息维护

1. 在仓库 Issues 中选择“手动录入招聘活动”或“提交招聘链接”。
2. 自动化会把 Issue 转换为 `data/candidates/` 下的待审核文件，并创建 Pull Request。
3. 管理员核对时间、地点、岗位、薪酬和来源，补全内容后再合并。
4. 合并到 `main` 后，GitHub Pages 自动执行质量检查并发布。

待审核文件不会被学生端读取，不会未经审核自动发布。

## 自动抓取

- 福建就业网适配器按日运行，结果写入 `data/candidates/` 并创建审核 Pull Request。
- 抓取结果默认标记为“需要人工判断专业相关性”。
- 其他高校站点保留明确的待适配状态，单个来源失败不会影响其他来源。
- 已发布链接每周检查一次；构建阶段只检查 URL 格式，避免外部网站波动阻断发布。
