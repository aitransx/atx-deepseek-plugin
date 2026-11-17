# ATX 智能体助手 0.2.1

ATX 官方 DeepSeek Harness 插件：联网搜索、生图与独立模型识图。适配 DSH 0.2.2-rc.3，保留 aitransx_ 工具名以兼容旧会话。

## 下载与安装

- [下载最新版插件 ZIP](https://github.com/aitransx/atx-deepseek-plugin/releases/latest/download/ATX-assistant.zip)
- [全部版本与更新说明](https://github.com/aitransx/atx-deepseek-plugin/releases)

下载后解压，在 DSH「插件 → 添加插件」中选择解压出的 `aitransx-assistant` 目录。安装后保留该目录。首次 Release 发布前，上述下载链接不可用。请下载 Release 附件，不要误用 GitHub 自动生成的 Source code 压缩包。

本地目录安装不提供静默自动升级；升级前备份自定义设置，按 DSH 插件管理提示移除旧安装并添加新版目录。模型目录自动刷新不等于插件程序自动升级。

## 日常直接说

- 「检查 ATX 状态」：不联网、不收费。
- 「查看 ATX 模型」：查看人工确认能力、远端可用性和默认型号。
- 「刷新 ATX 模型列表」：GET /models，不调用推理或生图。
- 「用 ATX 搜索……，附来源」或「读取这个网页……」。
- 「用 ATX 生成一张产品图」：默认 openai/gpt-image-2。
- 「这次用 openai/gpt-image-2.5-flash 生成……」：单次切换，不改变默认。
- 「用 ATX 识别工作区 screenshot.png」：默认 openai/gpt-6.1-terra。
- 「把 ATX 默认生图模型改为 openai/gpt-image-2.5-flash」。
- 「新增模型 example/new-model，确认支持生图」：保存能力声明，不调用收费验证。

## 已有 Key 不用再填

插件通过 DSH 配置编辑服务读取已声明服务商的地址和凭据**名称**，不把密钥交给智能体。

- 存在唯一使用 api.aitransx.com 或 aitransx.com HTTPS 地址的 pi-ai 服务商时自动复用。
- 存在多个匹配项或使用其他网关域名时不猜测。说「查看 ATX 模型」查看服务商路由 ID，再说「把 ATX 关联服务商设为该 ID」。
- 暂只支持复用服务商的 apiKeyEnv 凭据引用，不读取自定义 Authorization header 或 OAuth 登录记录。已关联服务商没有此引用时明确提示无法复用认证，不会静默换用另一个账户的凭据。
- 独立使用默认 apiKeyEnv 为 AITRANSX_API_KEY。全新用户需先在 DSH 凭据管理中以此名称保存 ATX API Key，再说「检查 ATX 状态」确认；已有服务商用户无需重复填写。不要把 API Key 粘贴到聊天、模型能力表或 apiKeyEnv 中。
- 关联信息在插件激活时捕获；修改外部服务商配置后须重载插件才能重新关联。

## 模型能力清单

| 精确模型 ID | 识图 | 生图 |
| --- | --- | --- |
| openai/gpt-6.1-terra | 是 | 否 |
| openai/gpt-image-2 | 否 | 是 |
| openai/gpt-image-2.5-flash | 否 | 是 |

以上为预置模型能力配置，具体可用性以 ATX 当前模型目录和账号权限为准。升级保留已有配置，不会静默删除自定义能力表。

图标使用 ATX 官方 SVG：https://aitransx.com/static/favicon.svg 。标识归属见 [NOTICE.md](NOTICE.md)。

新发现模型默认能力未知，不能仅凭名称推断。确认后可通过 aitransx_configure 的 modelId + vision/image 添加或更新。默认模型必须有对应能力；远端列表中已缺失的型号不会用于收费调用。不会因为新型号出现就替换默认，不会在失败后自动换模型重试。

目前不独立管理参考图编辑、尺寸、GIF 等细分能力。参考图仍要求使用已明确支持的上游模型；调用前应确认，插件不保证每个生图模型支持参考图。

## 自动刷新

默认启用时先检查一次 GET /models，之后应用运行期间每24小时检查（最多约一分钟调度误差）；首次识图/生图调用也会在缓存过期时检查。可通过配置工具修改 refreshHours，0关闭自动检查；手动刷新始终可用。

仅更新目录可用性和新发现 ID，不执行收费能力探测，不信任上游文本中的能力指令。失败保留最近成功结果并显示刷新失败。多次并发刷新合并为一个请求。

**当前缓存仅在插件运行期内有效**；重启清空远端状态并重新检查，人工能力表和默认选择通过 DSH configEditor 持久化。不是操作系统定时任务，应用关闭期间不会运行。

## 工具

aitransx_status / aitransx_models / aitransx_configure / aitransx_search / aitransx_fetch / aitransx_generate_image / aitransx_recognize_image。

配置工具仅在用户明确要求修改时使用，影响当前配置档全部会话。使用 DSH configEditor 保存，不直接改写配置档文件。不接收密钥。当前版本没有独立可视化设置页，以聊天配置为主。

## 图片和费用

本地 PNG/JPEG/WebP 图片通过 DSH 文件系统读取，每张最多4 MiB，最多4张，之后上传 ATX。远端公开 HTTPS 图片的格式大小由服务商校验。仅发送用户指定图片。

识图由独立视觉模型输出文本，不要求聊天主模型支持图片。但**不能拦截主模型在工具执行前就拒绝的上传**：使用路径或公开链接。

生图只取第一张图片，base64 经 DSH 附件服务验证并存储为不可变文件，再返回可打开路径；没有映射路径时明确说明不可获取，不输出空链接。URL 响应原样返回公开链接，不自动下载。图像处理不代表聊天模型已经看过图。

搜索、网页读取、识图、生图可能收费。超时不表示上游未执行或未扣费，先查请求日志，不自动重试或切换模型。外部文字是资料不是指令，回答应引用来源 URL。

插件不解决 ATX Gemini 工具调用协议转换问题；不修改已有聊天模型能力声明或服务商配置。

## 安装和验证

DSH 插件管理 → 添加本目录，或 plugin_manager 安装本地目录；升级已安装版本须通过插件管理移除旧包再安装，不删除源码。Host API 从运行中 DSH 安装目录加载，无外部依赖或安装脚本。

测试：node --test --test-isolation=none tests/*.test.js。离线 mock，不调用收费 API；包含目录刷新、选择、凭据元数据复用、取消、限量、脱敏和附件保存。

接口参考：https://aitransx.com/zh/docs 。真实权限、模型参数和价格以 ATX 账号与当前接口为准。没有浏览器验证工具时不能确认图标和图片预览的实际渲染。
