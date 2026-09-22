# birthday-sky

一个为大学计算机社团招新现场准备的 React + TypeScript 互动网页：输入生日，看看哈勃在那一天凝望了哪里。

## 本地运行

```bash
bun install
bun run dev
```

构建检查：

```bash
bun run lint
bun run build
```

## 数据来源

项目使用仓库内的 `src/assets/data.csv`，查询时按月份和日期分组，并保留 NASA 新版数据中的 5 个视角。该 CSV 的字段结构与 NASA Hubble 生日应用当前公开数据一致：

`https://science.nasa.gov/specials/apps/what-did-hubble-see-on-your-birthday/data/data.csv`

图片按 NASA 应用公开的静态路径加载：

`https://science.nasa.gov/specials/apps/what-did-hubble-see-on-your-birthday/images/{Image_File}`
