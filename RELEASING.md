# 发布与更新

仓库：https://github.com/aitransx/atx-deepseek-plugin

## 公开内容

仅提交插件源码、测试、图标和说明。不要提交 API Key、环境文件、个人 DSH 配置、本地压缩包或 .github 目录。.github 只保留在维护者本地，不使用远端 Actions 自动发布。

当前包名保留 @local/dsh-aitransx-assistant 以兼容已有安装；private: true 防止误发布 npm，不影响 GitHub Releases 或本地目录安装。尚未选择开源许可证，暂为 UNLICENSED。

## 手动发布新版

1. 修改 package.json 中的版本号，同时更新 README 版本标题。
2. 运行离线测试，检查语法、默认配置、敏感信息和包内文件清单。
3. 通过 npm pack 或 pnpm pack 生成 tgz，将同一份内容打成 ZIP；ZIP 顶层目录使用 aitransx-assistant。
4. 为 ZIP 与 tgz 生成 SHA256 校验文件。
5. 提交代码并推送 main，创建对应版本标签。
6. 由有权限的官方维护者手动创建 GitHub Release，上传 ATX-assistant.zip、tgz 和 SHA256SUMS.txt。
7. 核对 Release 非草稿、附件已上传，验证下载入口后再通知用户。

固定最新版下载地址：
https://github.com/aitransx/atx-deepseek-plugin/releases/latest/download/ATX-assistant.zip

这是专用插件安装包，不同于 GitHub 自动生成的 Source code ZIP。当前 ZIP 本地目录安装仍需用户手动升级，不会自动更新正在运行的插件程序。
