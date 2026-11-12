# 零号站

一个像素风的点击解谜小游戏，进站时输入自己的全名和口令，通关后可以看到写给每个人的专属内容；部分人在当铺库房的宝箱里还有一张照片。纯静态网页，不需要服务器。

## 放到 GitHub Pages

1. 新建一个仓库，把这个文件夹里的所有文件传上去（`index.html` 要在仓库根目录）。
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，保存。
3. 等一两分钟，页面地址是 `https://你的用户名.github.io/仓库名/`。

## 改祝福、加人

专属内容在 `js/endings.js` 里，宝箱照片在 `js/photos.js` 里，都用每个人的「全名 + 口令」加密，直接看源码读不到。改名单或换照片请用私有目录里的 `build-endings.mjs`（`node build-endings.mjs people.json 仓库/js`），它会同时重新生成这两个文件。

1. 修改你本地的 `people.json`（明文，**不要上传到仓库**，`.gitignore` 已经把它排除了）。
2. 用浏览器打开 `tools/editor.html`，贴入 `people.json` 的内容，点「生成」。
3. 用生成的内容覆盖 `js/endings.js`，重新上传。

口令不分大小写，全名里的空格不计。口令越短越容易被猜到，像 `1` 这样的口令基本等于没有加密。

## 背景音乐（可选）

把一首 mp3 放到 `audio/bgm.mp3`，游戏会自动循环播放它。没有这个文件时，用的是代码合成的环境音。声音不参与任何谜题，静音也能通关。

## 文件

- `index.html` 页面
- `js/game.js` 游戏本体
- `js/endings.js` 加密后的专属内容
- `tools/editor.html` 加密工具

## 上传前检查清单

1. 在私人目录里运行 `node check-public.mjs people.json 仓库目录`，看到「隐私检查通过」再上传。
2. 仓库里只应该有 `index.html`、`js/`、`tools/`、`audio/`、`README.md`。`people.json`、原始照片、`station-private` 整个目录都不能进仓库。
3. 如果以前不小心提交过私人文件，光删除不够，Git 历史里还留着。最简单的办法是删掉仓库重新建一个。
4. 这里的加密是「防君子不防小人」：知道某人全名的人，可以离线反复试口令。口令越短越容易被试出来，介意的话用 6 位以上、带字母的口令。
