# FiaCloud

FiaCloud 是一款轻量级、现代化的云存储（S3/R2）管理客户端。基于 React + TypeScript + Vite 构建，提供直观的界面来管理、预览和编辑您的云端文件。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## ✨ 特性

- **多配置管理**：支持保存多个 S3/R2 配置，轻松切换不同的存储桶。
- **文件树浏览**：以层级结构展示存储桶内容，支持文件夹展开/收起。
- **强大的预览功能**：
  - **代码/文本**：内置 Monaco Editor，支持多种编程语言的高亮显示。
  - **JSON**：交互式 JSON 树状视图。
  - **CSV**：自动解析并以表格形式展示 CSV 数据。
- **在线编辑**：支持直接在浏览器中编辑文本文件并保存回云端。
- **现代化 UI/UX**：
  - **响应式布局**：可拖动调节宽度的侧边栏，实时变换主视图大小。
  - **主题自适应**：支持浅色模式、深色模式及跟随系统主题。
  - **自定义滚动条**：丝滑且美观的自定义滚动条，适配不同颜色模式。
- **轻量快捷**：基于 Vite 构建，极致的加载速度和开发体验。

## 🛠️ 技术栈

- **前端框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 7](https://vitejs.dev/)
- **编程语言**: [TypeScript](https://www.typescriptlang.org/)
- **存储交互**: [@aws-sdk/client-s3](https://aws.amazon.com/sdk-for-javascript/)
- **编辑器**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **数据处理**: [PapaParse](https://www.papaparse.com/) (CSV), [react-json-view](https://github.com/mac-s-g/react-json-view) (JSON)

## 🚀 快速开始

### 前置条件

- Node.js (建议 v18+)
- npm 或 yarn

### 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/fiaclouds.git
   cd fiaclouds
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 构建生产版本：
   ```bash
   npm run build
   ```

## 📖 使用指南

1. **配置 S3/R2**：点击侧边栏底部的“设置”按钮，添加您的 Access Key、Secret Key、Endpoint 和 Bucket 名称。
2. **浏览文件**：在左侧文件列表中点击文件夹展开内容，点击文件进行预览。
3. **编辑文件**：对于支持的文本文件，切换到“源码”模式即可进行编辑，点击“保存”同步至云端。
4. **调整布局**：将鼠标悬停在侧边栏右边缘，出现双向箭头后即可左右拖动以调整宽度。

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE) 协议授权。
