# LUT 文件打包说明

## 概述

本文档说明如何确保 `original.cube` LUT 文件在构建打包时被正确包含到应用程序中。

## 文件位置

LUT 文件位于：
```
public/images/original.cube
```

## 构建配置

### 1. package.json 配置

在 `package.json` 的 `build` 部分，已配置：

```json
{
  "build": {
    "files": [
      "dist/**/*",
      "electron/**/*",
      "public/icons/**/*",
      "public/fonts/**/*",
      "public/images/**/*",  // 包含 LUT 文件
      "public/xdllogo.ico",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "public/images",
        "to": "public/images",
        "filter": ["**/*"]  // 包含所有图片文件，包括 .cube 文件
      }
    ]
  }
}
```

### 2. build/build.js 配置

构建脚本中也有相同的配置，确保双重保障。

## 路径解析

在 `electron/modules/obsset_modules/setfilter.js` 中，`getLUTFilePath()` 函数会根据环境自动解析正确的路径：

- **开发环境**: 使用相对路径
- **生产环境**: 使用 `process.resourcesPath` + `public/images/original.cube`

## 验证步骤

### 构建前检查

运行以下命令检查资源文件：
```bash
npm run check-resources
```

### 构建

运行完整构建（包含自动检查）：
```bash
npm run electron:build
```

### 构建后验证

验证构建结果：
```bash
npm run verify-build
```

## 故障排除

### 1. 文件未找到

如果构建后 LUT 文件未找到：

1. 检查源文件是否存在：`public/images/original.cube`
2. 运行 `npm run check-resources` 验证
3. 检查构建配置中的 `files` 和 `extraResources`

### 2. 路径解析错误

如果运行时路径解析失败：

1. 检查 `getLUTFilePath()` 函数的日志输出
2. 确认 `app.isPackaged` 状态
3. 验证 `process.resourcesPath` 路径

### 3. 文件格式问题

如果 LUT 文件格式有问题：

1. 检查文件是否以 `LUT_1D_SIZE` 开头
2. 确认文件编码为 UTF-8
3. 验证文件大小（应该约为 0.85 KB）

## 自动化检查

构建过程中会自动运行以下检查：

1. **构建前**: 检查所有资源文件是否存在
2. **构建中**: 验证配置和文件包含
3. **构建后**: 验证最终打包结果

## 相关文件

- `public/images/original.cube` - LUT 文件
- `electron/modules/obsset_modules/setfilter.js` - 路径解析逻辑
- `build/build.js` - 构建配置
- `build/check-resources.js` - 资源检查脚本
- `build/verify-build.js` - 构建验证脚本
- `package.json` - 包配置

## 注意事项

1. 不要手动修改 `original.cube` 文件，除非你了解 LUT 格式
2. 如果需要更换 LUT 文件，确保新文件格式正确
3. 构建前始终运行资源检查
4. 在不同环境中测试路径解析功能
