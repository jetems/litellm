# i18n 脚本使用文档

本文档详细介绍了 `ui/litellm-dashboard/scripts/` 目录下用于国际化（i18n）提取与恢复的脚本使用方法。

## 1. 提取脚本 (`extract_translations.py`)

此脚本用于从源代码中提取国际化相关的字符串、组件使用、Import 语句及 Hook 调用，并将它们备份到 `i18n_backup.json` 文件中。

### 功能特点
*   **字符串提取**: 提取 `t("String")` 和 `<T>String</T>` 中的内容。
*   **元数据记录**: 记录引用的 `import { ... } from "@/i18n"` 和 `useTranslate` Hook 的行号位置。
*   **增量/单文件支持**: 支持仅更新特定文件或目录的提取信息，而不覆盖其他文件的备份。

### 用法

```bash
# 提取所有文件（默认扫描 src 目录）
python3 scripts/extract_translations.py

# 提取指定单个文件
python3 scripts/extract_translations.py ui/litellm-dashboard/src/app/login/LoginPage.tsx

# 提取指定目录
python3 scripts/extract_translations.py ui/litellm-dashboard/src/components
```

### 输出
*   生成的备份文件位于项目根目录：`ui/litellm-dashboard/i18n_backup.json`。

---

## 2. 恢复脚本 (`restore_translations.py`)

此脚本用于根据备份文件 (`i18n_backup.json`) 将国际化代码恢复到源文件中。适用于代码被意外回滚或清理后的恢复。

### 功能特点
*   **智能恢复**:
    *   **t() 调用**: 自动将 `str` 包裹为 `{t("str")}`。
    *   **T 组件**: 将 `str` 包裹为 `<T>str</T>`。
    *   **Imports/Hooks**: 根据备份的行号信息，尝试将缺失的引用插入到原始位置。
*   **智能匹配**: 支持模糊路径匹配（后缀匹配），方便用户输入。
*   **防呆机制**:
    *   防止 `<T><T>Content</T></T>` 双重包裹。
    *   防止 `<T>{t("Content")}</T>` 冗余包裹（会自动清理）。
    *   处理多行 `t()` 调用，避免重复包裹。

### 用法

```bash
# 恢复所有文件
python3 scripts/restore_translations.py

# 恢复指定单个文件（支持绝对路径或相对路径）
python3 scripts/restore_translations.py ui/litellm-dashboard/src/app/login/LoginPage.tsx

# 指定备份文件位置（可选）
python3 scripts/restore_translations.py --backup path/to/my_backup.json
```

---

## 3. 常见工作流

1.  **开发阶段备份**:
    定期运行 `extract_translations.py` 以确保最新的 i18n 状态被保存。
    ```bash
    python3 scripts/extract_translations.py
    ```

2.  **代码清理/重构后恢复**:
    如果重构导致部分翻译丢失（例如 `t()` 被移除），运行恢复脚本。
    ```bash
    python3 scripts/restore_translations.py
    ```

3.  **修复特定文件**:
    如果发现某个文件的翻译有问题，可以单独针对该文件进行提取或恢复测试。
    ```bash
    python3 scripts/restore_translations.py src/my/broken/File.tsx
    ```
