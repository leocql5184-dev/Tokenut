# Tokenut

一个会随 Token 用量进化的 Windows 桌面伙伴。

## **向孙哥（孙宇晨）的目标对标：每天一亿 Token！**

**项目灵感来自孙哥（孙宇晨）提出的「每天一亿 Token」目标。** 我们向这个目标对标，把每天的使用量变成看得见的充能进度和角色变化。

[![孙宇晨谈每天消耗一亿 Token：真实视频预览画面](assets/readme/justin-sun-100m-interview.jpg)](https://www.youtube.com/watch?v=020p6YCNSHI)

*图片为对应视频的原始预览图，非 AI 生成。来源：[WuBlockchain 视频《孙宇晨：我自己每天消耗 1 亿 Token》](https://www.youtube.com/watch?v=020p6YCNSHI)，发布于2026年4月27日；[哔哩哔哩同题视频](https://www.bilibili.com/video/BV1storBeEgS/)。图片内文字由视频发布者添加。*

## 下载与使用

1. 打开本仓库的 **Releases（发行版）**，下载 `Tokenut-版本号-Windows-x64.zip`。
2. **完整解压**，打开文件夹，双击 `Tokenut.exe`。不要只拿出 EXE，也不要在压缩包里直接运行。
3. 首次启动在“选择用量来源”中勾选 **Codex、DeepSeek Harness，或两者都选**。使用对应工具完成一次对话，显示“已连接”即可。Tokenut 每 **5 秒**自动更新。

**不需要安装 Node.js、不需要填写 API Key、不需要配置端口，也不需要把账号密码交给 Tokenut。** 当前支持 Windows x64。

新用户默认不勾选任何来源；旧版本升级会保留原来的 Codex 连接。首次没有数据时，先使用勾选的工具完成一次对话。更新取决于该工具何时将实际用量写入日志，并非逐个生成 Token 的实时计数。

## 怎么操作

| 操作 | 功能 |
| --- | --- |
| 点击角色 | 打开每日用量折线图 |
| 按住角色拖动 | 移动桌面组件 |
| 右键角色或点击「···」 | 调整大小和置顶、减少动画、退出 |
| 点击同步按钮 | 立即读取最新记录 |
| 关闭折线图窗口 | 桌面组件继续记录 |

折线图支持 **近7天、近1月、近3月、近6月**。今天持续更新，北京时间每天 **00:00 归档前一天**，历史记录保存在本机。

## 七个阶段

| 当天 Token 用量 | 形态 |
| --- | --- |
| 0 | 原初之息 |
| 100万 | 微光觉醒 |
| 1000万 | 赤怒修罗 |
| 3000万 | 鎏金帝皇 |
| 6000万 | 万钻神躯 |
| 9000万 | 量子天尊 |
| 1亿 | 虹耀超限 |

<p>
<img src="assets/character/stages-v1/01-000m-initial.png" width="120" alt="1. 原初之息" />
<img src="assets/character/stages-v1/02-001m-awakening.png" width="120" alt="2. 微光觉醒" />
<img src="assets/character/stages-v1/04-030m-anger.png" width="120" alt="3. 赤怒修罗" />
<img src="assets/character/stages-v1/05-060m-gold.png" width="120" alt="4. 鎏金帝皇" />
<img src="assets/character/stages-v1/05-060m-diamond.png" width="120" alt="5. 万钻神躯" />
<img src="assets/character/stages-v1/06-090m-charging.png" width="120" alt="6. 量子天尊" />
<img src="assets/character/stages-v1/07-100m-ultimate.png" width="120" alt="7. 虹耀超限" />
</p>

第三至第七阶段分别使用柔和热光与零星火星、流动金砂、表面钻光、电弧线路与虹彩裂光，各有独立轮廓和运动方式。菜单中的“减少动态效果”可保留静态材质特效并停止运动。

七张 PNG 均随程序附带，也可在解压后的 `assets/character/stages-v1/` 文件夹查看，不需要另外下载。

真实 Token 用量跨过阶段门槛时，角色及周身特效自动用约20秒交叉融合，过渡期间两种特效持续运动；日常粒子、呼吸与流光速度放慢为原来的约1/4，进度条颜色同步缓慢变化。

充能条按实际用量线性增长：1000万显示 10%，5000万显示 50%，一亿显示 100%。旁边数字表示真实记录量；超过一亿仍继续计数。

## 选择和连接用量来源

点击角色，在客户端顶部勾选要统计的工具：

- **只选 Codex**：只统计 Codex。
- **只选 DeepSeek Harness**：只统计 Harness。
- **两者都选**：汇总两者，驱动同一角色、进度条和每日折线图。

每个来源有独立的连接状态、自动检测和文件夹选择按钮。找不到记录时，先使用该工具完成一次对话，再点“自动检测”；仍找不到就点“选择记录文件夹”。

| 来源 | 默认记录目录 |
| --- | --- |
| Codex | `C:\Users\你的用户名\.codex\sessions` |
| DeepSeek Harness | `C:\Users\你的用户名\.dsh\sessions` |

也可以选择对应的 `.codex` 或 `.dsh` 上级文件夹，程序会自动定位 `sessions`。支持 `CODEX_HOME` 和 `DSH_HOME` 自定义位置，但一般不必设置环境变量。

**取消勾选只停止计入，不删除该来源的历史。** 重新勾选后恢复；每个来源切换目录时分别保存历史。折线图和今日总数都只汇总当前勾选的来源。某个来源读取失败时保留它已保存的用量，并显示异常，其他来源继续更新。

Harness 支持 v3/v4 的 `.jsonl.zstd` 和 `.jsonl` 日志：按会话选择最高格式版本，排除分支继承记录；最终用量替换同一次尝试的中间记录，重试单独计入。优先使用模型报告的 `totalTokens`，否则合计互不重叠的输入、输出、缓存读写；推理 Token 不重复相加。只计实际报告的用量，不把上下文估算当消耗。未支持的版本会显示读取异常。

只统计**当前设备上所选目录内的会话**，无需 Tokenut 登录账号、填写 API Key 或开网络端口；不读取凭据文件、不调用模型、不上传会话。它不是跨设备账号账单，同一系统用户切换模型账号可能仍计在同一个来源中。

后续来源通过 `src/usage-manager.cjs` 的来源注册表扩展，复用相同的选择、连接和汇总流程。目前只提供上面两种来源。

统计格式依据：[Harness 会话存储说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-persistence-jsonl/README.md)、[实际用量统计说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/token-meter/README.md)。

## 常见问题

**没有用量？** 确认已勾选对应来源、本机用过该工具且记录目录内有文件，再点击「同步记录」。只有网页或其他设备上的记录不会出现。工具日志格式变化可能需要更新本软件。

**关机后怎么办？** 退出或关机时不运行。重启后从仍存在的日志补回可读取记录；删除、缺失或移到其他归档目录的日志可能无法补全。无记录日期留空，不假装是零。

**数据在哪？** 通常在 `%APPDATA%\tokenut\usage.json`，包含每日汇总和设置。更新程序不主动删除数据；请勿公开上传此文件。

**Windows 安全提示？** 当前程序未做代码签名。请确认下载来源可信，可用随版本提供的 `.sha256` 校验包文件，不要关闭系统安全保护。

## 说明

独立项目，与 OpenAI、Codex 及文中人物不存在官方合作或背书关系。角色素材权利归原权利人所有，公开分发或商业使用前请确认素材授权。项目尚未声明开源代码许可证；公开仓库不代表第三方素材获得授权。
