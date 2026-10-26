# Naclock

横屏全屏的**时钟 + 番茄钟**，纯 HTML/CSS/JS，用 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（HTML5+ / 5+ App）打包成 Android APK。

适合把旧手机/平板挂在墙上当桌面时钟，同时兼顾番茄工作法的专注计时。

## 功能

- **时钟**：数字/模拟两种样式，字号、字体、颜色、背景都可调
- **番茄钟**：专注时长可设，到点提醒，与时钟同屏
- **自定义标语**：显示在时钟下方的一句话
- **背景**：预设色 / 自定义颜色 / 图片背景
- **横屏全屏**：`screenOrientation: landscape-*` + `fullscreen: true`，启动即全屏无状态栏
- **更新检查**：`ver.js` 拉 `version.json` 比对版本，有新版本时弹更新提示

## 直接运行

双击 `index.html` 用浏览器打开即可（纯前端，无需构建）。

## 用 HBuilderX 打包

```
HBuilderX → 文件 → 打开目录 → 选择本目录
→ 运行 → 运行到浏览器 / 运行到手机或模拟器
→ 发行 → 原生App-云打包
```

- `manifest.json` 是 5+ App 配置（已含 appid `H59003761`、权限、横屏、全屏、启动页设置）
- 云打包时**必须选择与原版相同的证书**，否则无法覆盖安装（会 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`）
- 打包前把要发布的前端文件放进项目根目录（本仓库是未混淆的源码版）

## 目录

```
index.html     入口页（启动、更新弹窗）
page.html      主界面（时钟 / 番茄 / 各设置面板）
page.js        主逻辑
page.css       样式
ques.html      问卷页
inde.js        启动脚本
ver.js         版本检查
manifest.json  5+ App 配置（appid / 权限 / 横屏 / 全屏）
icon.png       图标（72px，manifest 指向它）
res/           资源（music/ 提示音、pic/ 图片）
```

## 版本

- **3.79**（versionCode 3079）— 当前 Release 对应的线上版本

## 原仓库

早期版本在 Gitee：[gitee.com/nainoz_naa/naclock](https://gitee.com/nainoz_naa/naclock)（`ver.js` 的更新检查仍指向那里的 `version.json`）

## License

MIT，见 [LICENSE](LICENSE)。
