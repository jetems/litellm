# LiteLLM Dashboard 前端开发 AI 规则

本文档是 AI 辅助开发 LiteLLM Dashboard 前端项目的规则指南。

## 项目概述

LiteLLM Dashboard 是 LiteLLM Proxy 的管理界面，提供 API Key 管理、模型配置、用户管理、日志查看等功能。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **框架** | Next.js (App Router) | 14.x |
| **语言** | TypeScript | 5.3.x |
| **UI 库** | React | 18.x |
| **样式** | TailwindCSS | 3.4.x |
| **组件库** | Tremor UI + Ant Design | @tremor/react 3.13.x, antd 5.x |
| **状态管理** | React Query + React Context | @tanstack/react-query 5.x |
| **测试** | Vitest + Testing Library | vitest 3.x |
| **代码风格** | ESLint + Prettier | - |

## 项目结构

```
ui/litellm-dashboard/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (dashboard)/        # Dashboard 路由组
│   │   ├── login/              # 登录页面
│   │   ├── page.tsx            # 主页面（路由分发）
│   │   ├── layout.tsx          # 根布局
│   │   └── globals.css         # 全局样式
│   ├── components/             # 组件目录
│   │   ├── atoms/              # 原子组件（Tooltip 等）
│   │   ├── molecules/          # 分子组件（Filter, Notifications）
│   │   ├── organisms/          # 有机体组件（Create Key Button）
│   │   ├── common_components/  # 通用共享组件
│   │   ├── networking.tsx      # API 调用层（核心文件）
│   │   └── [feature]/          # 功能模块组件
│   ├── i18n/                   # 国际化模块
│   │   ├── I18nContext.tsx     # 语言 Context 和 Provider
│   │   ├── translate.ts        # 翻译函数
│   │   ├── T.tsx               # 翻译包装组件
│   │   ├── index.ts            # 统一导出
│   │   └── locales/            # 翻译文件
│   │       ├── en.json         # 英文
│   │       └── zh-CN.json      # 中文
│   ├── contexts/               # React Context
│   ├── hooks/                  # 自定义 Hooks
│   ├── utils/                  # 工具函数
│   ├── lib/                    # 库配置
│   └── types.ts                # 全局类型定义
├── tests/                      # 测试文件
│   ├── setupTests.ts           # 测试环境配置
│   └── *.test.tsx              # 测试用例
└── [配置文件]                   # package.json, tsconfig.json 等
```

## 开发规范

### 1. 组件开发

#### 组件命名和文件组织
- **文件命名**: 使用 `snake_case.tsx`（如 `model_hub_table.tsx`）
- **组件命名**: 使用 `PascalCase`（如 `ModelHubTable`）
- **测试文件**: 与组件同目录，使用 `*.test.tsx` 后缀

#### 组件结构模式
```tsx
// 1. 导入声明
import { Button, Card } from "@tremor/react";
import { Form, Input } from "antd";

// 2. 类型定义
interface ComponentProps {
  accessToken: string | null;
  userRole: string | null;
}

// 3. 组件实现
const MyComponent: React.FC<ComponentProps> = ({ accessToken, userRole }) => {
  // 状态声明
  const [loading, setLoading] = useState(false);
  
  // 副作用
  useEffect(() => { /* ... */ }, []);
  
  // JSX 渲染
  return <div>...</div>;
};

// 4. 导出
export default MyComponent;
```

#### 遵循原子化设计
- **atoms**: 最小不可分割的 UI 元素（按钮、输入框、Tooltip）
- **molecules**: 由多个 atoms 组成的组件（表单项、过滤器）
- **organisms**: 复杂的业务组件（表格、模态框）
- **templates**: 页面级别的布局组件

### 2. 样式规范

#### TailwindCSS 使用
```tsx
// ✅ 正确：使用 Tailwind 类名
<div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">

// ✅ 正确：使用 Tremor 颜色系统
<div className="bg-tremor-background text-tremor-content">

// ❌ 避免：内联样式（除非必要）
<div style={{ display: 'flex', padding: '16px' }}>
```

#### Tremor 颜色系统
项目使用 Tremor 的颜色主题系统（定义在 `tailwind.config.ts`）：
- `tremor-brand-*`: 品牌色（indigo 系）
- `tremor-background-*`: 背景色
- `tremor-content-*`: 文本色
- `dark-tremor-*`: 暗色模式变体

### 3. API 调用

#### 使用 networking.tsx
所有 API 调用都应通过 `src/components/networking.tsx` 进行：

```tsx
import { 
  getProxyBaseUrl,
  modelInfoCall,
  keyCreateCall 
} from "@/components/networking";

// 调用示例
const models = await modelInfoCall(accessToken);
```

#### 错误处理模式
```tsx
try {
  const response = await apiCall(accessToken, data);
  message.success("操作成功");
} catch (error) {
  message.error("操作失败: " + parseErrorMessage(error));
}
```

### 4. 状态管理

#### React Query 用于服务端状态
```tsx
import { useQuery, useMutation } from "@tanstack/react-query";

// 查询
const { data, isLoading } = useQuery({
  queryKey: ["models"],
  queryFn: () => modelInfoCall(accessToken),
});

// 变更
const mutation = useMutation({
  mutationFn: (data) => createModelCall(accessToken, data),
});
```

#### React Context 用于全局状态
```tsx
import { useTheme } from "@/contexts/ThemeContext";

const { logoUrl, setLogoUrl } = useTheme();
```

#### 本地状态使用 useState
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);
```

### 5. 测试规范

#### 测试文件结构
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent accessToken="test" />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

#### 测试运行命令
```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 运行特定文件
npx vitest run src/components/MyComponent.test.tsx
```

#### Mock 模式
```tsx
// Mock API 调用
vi.mock("@/components/networking", () => ({
  modelInfoCall: vi.fn(() => Promise.resolve({ data: [] })),
}));

// Mock 通知管理器
vi.mock("@/components/molecules/notifications_manager", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
```

### 6. 组件库使用指南

#### Tremor UI（优先使用）
用于数据展示和仪表板组件：
```tsx
import { Card, Button, Table, Badge, ProgressBar } from "@tremor/react";
```

#### Ant Design（表单和复杂交互）
用于表单、模态框等交互组件：
```tsx
import { Form, Input, Modal, Select, message } from "antd";
```

#### 图标
```tsx
// Ant Design 图标
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

// Heroicons（Tremor 配套）
import { TrashIcon } from "@heroicons/react/outline";

// Lucide React
import { Plus, Trash2 } from "lucide-react";
```

### 7. 代码风格

#### Prettier 配置（.prettierrc）
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 120,
  "trailingComma": "all"
}
```

#### ESLint 规则
- 禁止未使用的导入（自动删除）
- 允许 `any` 类型（`@typescript-eslint/no-explicit-any: off`）
- 允许 `@ts-comment`

#### 格式化命令
```bash
npm run format       # 格式化代码
npm run format:check # 检查格式
npm run lint         # ESLint 检查
```

### 8. 路由和导航

#### 页面路由模式
主页面 `page.tsx` 使用 URL 查询参数进行路由：
```tsx
// URL: /?page=models
const [page, setPage] = useState(searchParams.get("page") || "api-keys");
```

#### 常用页面路由
| 路由参数 | 页面 |
|----------|------|
| `api-keys` | API Key 管理 |
| `models` | 模型管理 |
| `users` | 用户管理 |
| `teams` | 团队管理 |
| `logs` | 日志查看 |
| `usage` | 使用量统计 |
| `llm-playground` | Playground |

### 9. 认证和权限

#### Token 处理
```tsx
import { isJwtExpired } from "@/utils/jwtUtils";
import { clearTokenCookies } from "@/utils/cookieUtils";

// 检查 token 有效性
if (isJwtExpired(token)) {
  clearTokenCookies();
  // 重定向到登录页
}
```

#### 角色判断
```tsx
import { isAdminRole } from "@/utils/roles";

if (isAdminRole(userRole)) {
  // 显示管理员功能
}
```

### 10. 国际化 (i18n)

#### 翻译组件使用
```tsx
import { T, useTranslate } from "@/i18n";

// 方式 1：使用 <T> 包装组件
<T>Virtual Keys</T>  // 自动翻译为"虚拟密钥"

// 方式 2：使用 useTranslate hook
const t = useTranslate();
<span>{t("Create New Key")}</span>

// 带变量的翻译
<T vars={{ count: 5 }}>You have {count} items</T>
```

#### 语言切换
```tsx
import { useI18n } from "@/i18n";

const { locale, setLocale } = useI18n();
setLocale("zh-CN");  // 切换到中文
```

#### 添加新翻译
1. 在 `src/i18n/locales/en.json` 添加英文
2. 在 `src/i18n/locales/zh-CN.json` 添加中文翻译
3. 使用 `<T>` 或 `t()` 包装文本

#### 支持的语言
| 代码 | 语言 |
|------|------|
| `en` | English |
| `zh-CN` | 中文 |

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（使用 Turbo 模式）
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test

# 代码格式化
npm run format

# ESLint 检查
npm run lint
```

## 注意事项

> [!IMPORTANT]
> **核心文件**: `networking.tsx` 包含 8000+ 行代码，是 API 调用的核心。修改时需格外谨慎。

> [!TIP]
> **组件位置**: 新组件应放在 `src/components/` 下对应的功能目录中，测试文件放在同目录。

> [!WARNING]
> **静态导出**: 项目配置为静态导出（`output: "export"`），不支持服务端渲染相关功能。

> [!CAUTION]
> **依赖版本**: React 18 + Next.js 14 组合，确保安装的依赖与此版本兼容。
