"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type StudioLocale = "en" | "zh-CN";

const STUDIO_LOCALE_STORAGE_KEY = "openclaw-studio.locale";
const DEFAULT_LOCALE: StudioLocale = "en";

const ZH_CN_TRANSLATIONS: Record<string, string> = {
  // Header and global actions
  "Open studio menu": "打开 Studio 菜单",
  "Gateway connection": "网关连接",
  "Switch language": "切换语言",
  "Language": "语言",
  "English": "English",
  "Simplified Chinese": "简体中文",
  "Back to chat": "返回聊天",

  // Status labels
  "Disconnected": "未连接",
  "Connecting": "连接中",
  "Connected": "已连接",
  "Reconnecting": "重连中",
  "Error": "错误",
  "Idle": "空闲",
  "Running": "运行中",
  "Needs approval": "需要审批",

  // Generic
  "Close": "关闭",
  "Copy": "复制",
  "Copied": "已复制",
  "Copy failed": "复制失败",
  "Copy command": "复制命令",

  // Connection panel
  "Stored token available on this Studio host. Leave blank to keep it.":
    "此 Studio 主机上已保存 token。留空则继续使用。",
  "A local OpenClaw token is available on this host. Leave blank to use it.":
    "此主机上检测到本地 OpenClaw token。留空则使用该 token。",
  "Enter the token Studio should use for this upstream.": "请输入 Studio 连接上游时使用的 token。",
  "Saving…": "保存中…",
  "Save settings": "保存设置",
  "Testing…": "测试中…",
  "Test connection": "测试连接",
  "Disconnect": "断开连接",
  "Close gateway connection panel": "关闭网关连接面板",
  "Upstream gateway URL": "上游网关 URL",
  "Upstream token": "上游 token",
  "Unsaved changes": "有未保存更改",
  "Saved upstream:": "已保存上游：",
  "not configured": "未配置",

  // Gateway connect screen
  "Studio to OpenClaw": "Studio 到 OpenClaw",
  "Save a gateway URL and token for this Studio host.":
    "为此 Studio 主机保存网关 URL 和 token。",
  "Upstream URL": "上游 URL",
  "keep existing token": "保留现有 token",
  "gateway token": "网关 token",
  "Hide token": "隐藏 token",
  "Show token": "显示 token",
  "A token is already stored on this Studio host. Leave this blank to keep it.":
    "此 Studio 主机已保存 token。留空则继续使用。",
  "A local OpenClaw token is available on this host. Leave this blank to use it.":
    "此主机上检测到本地 OpenClaw token。留空则使用该 token。",
  "Enter the gateway token Studio should use.": "请输入 Studio 使用的网关 token。",
  "Everything on this computer": "全部在当前电脑上",
  "Studio and OpenClaw both run on the same machine.": "Studio 和 OpenClaw 运行在同一台机器上。",
  "Studio here, OpenClaw in the cloud": "Studio 在本机，OpenClaw 在云端",
  "Keep Studio on your laptop and point it at a remote gateway.":
    "保持 Studio 在你的电脑上，并连接到远程网关。",
  "Studio and OpenClaw on the same cloud machine": "Studio 与 OpenClaw 在同一台云主机",
  "Use localhost for the upstream, then solve how you open Studio.":
    "上游使用 localhost，然后再处理如何访问 Studio。",
  "How you open Studio": "如何访问 Studio",
  "Open": "打开",
  "on this computer.": "（在当前电脑上）",
  "Only the OpenClaw upstream changes in this setup. Studio itself stays local.":
    "在此方案中，只有 OpenClaw 上游地址会变化，Studio 本身保持本地运行。",
  "Studio is on a remote host.": "Studio 位于远程主机上。",
  "only opens on that machine.": "只能在该主机上访问。",
  "Recommended: Tailscale Serve": "推荐：Tailscale Serve",
  "Fallback: SSH tunnel": "备用：SSH 隧道",
  "Use this if Tailscale is not available yet.": "若暂时不能使用 Tailscale，可使用此方案。",
  "How Studio reaches OpenClaw": "Studio 如何连接 OpenClaw",
  "Recommended: keep the remote gateway on loopback and expose it with Tailscale Serve.":
    "推荐：让远程网关仅监听回环地址，并通过 Tailscale Serve 暴露。",
  "On the gateway host": "在网关主机上",
  "Use SSH tunnel URL": "使用 SSH 隧道 URL",
  "Keep the upstream local to the Studio host:": "将上游保持为 Studio 主机本地：",
  "Start OpenClaw on this host": "在此主机启动 OpenClaw",
  "Use the same machine for both processes, even if that machine is a cloud VM.":
    "即使是云主机，也建议在同一台机器上运行两者。",
  "Use localhost upstream": "使用 localhost 上游",
  "Use local defaults": "使用本地默认值",
  "Local OpenClaw settings were detected at": "检测到本地 OpenClaw 设置文件：",
  "Studio can reuse that local URL and token.": "Studio 可复用该本地 URL 和 token。",

  // Fleet and create modal
  "All": "全部",
  "Approvals": "审批",
  "Agents": "智能体",
  "Creating...": "创建中...",
  "New agent": "新建智能体",
  "No agents available.": "暂无可用智能体。",
  "Create agent": "创建智能体",
  "Launch agent": "启动智能体",
  "Name it and activate immediately.": "命名后立即激活。",
  "Name": "名称",
  "Agent name": "智能体名称",
  "My agent": "我的智能体",
  "You can rename this agent from the main chat header.":
    "你可以稍后在主聊天头部重命名该智能体。",
  "Choose avatar": "选择头像",
  "Shuffle avatar selection": "随机更换头像",
  "Shuffle": "随机",
  "Authority can be configured after launch.": "启动后可配置权限。",
  "Launching...": "启动中...",

  // Main page and workspace
  "Connecting to gateway…": "正在连接网关…",
  "Booting Studio…": "正在启动 Studio…",
  "Loading agents…": "正在加载智能体…",
  "Behavior": "行为",
  "Capabilities": "能力",
  "Automations": "自动化",
  "Advanced": "高级",
  "Agent settings": "智能体设置",
  "Model": "模型",
  "Thinking": "思考",
  "Unsaved": "未保存",
  "Saved ✓": "已保存 ✓",
  "Agent not found.": "未找到智能体。",
  "Back to chat and select an available agent.": "返回聊天并选择一个可用智能体。",
  "Fleet": "队列",
  "Chat": "聊天",
  "No agents match this filter.": "没有智能体匹配当前筛选。",
  "Use New Agent in the sidebar to add your first agent.":
    "在侧边栏点击“新建智能体”来添加第一个智能体。",
  "Connect to your gateway to load agents into the studio.":
    "连接你的网关后即可将智能体加载到 Studio。",
  "Creating agent": "创建智能体",
  "Agent create in progress": "正在创建智能体",
  "Studio is temporarily locked until creation finishes.":
    "在创建完成前，Studio 将暂时锁定。",
  "Waiting for active runs to finish": "等待正在运行的任务完成",
  "Submitting config change": "提交配置变更中",
  "Deleting agent and restarting gateway": "删除智能体并重启网关",
  "Renaming agent and restarting gateway": "重命名智能体并重启网关",
  "Agent delete in progress": "正在删除智能体",
  "Agent rename in progress": "正在重命名智能体",
  "Studio is temporarily locked until the gateway restarts.":
    "在网关重启完成前，Studio 将暂时锁定。",

  // Agent chat panel core controls
  "Stop unavailable:": "无法停止：",
  "Stop": "停止",
  "Stopping": "停止中",
  "No models found": "未找到模型",
  "Off": "关闭",
  "Minimal": "最小",
  "Low": "低",
  "Medium": "中",
  "High": "高",
  "Default": "默认",
  "Queued messages": "排队消息",
  "Queued": "排队",
  "type a message": "输入消息",
  "Choose model": "选择模型",
  "Model selector": "模型选择",
  "Select reasoning effort": "选择思考强度",
  "Show": "显示",
  "Show tool calls": "显示工具调用",
  "Show thinking": "显示思考过程",
  "Jump to latest": "跳转到最新",
  "Show older": "显示更早",
  "Load more": "加载更多",
  "Start new session": "开始新会话",
  "Starting...": "启动中...",
  "New session": "新会话",
  "Open behavior": "打开行为设置",
  "Behavior settings": "行为设置",
  "Shuffle avatar": "随机头像",
  "Edit agent name": "编辑智能体名称",
  "Save agent name": "保存智能体名称",
  "Cancel agent rename": "取消重命名",
  "Rename agent": "重命名智能体",
  "Agent name is required.": "智能体名称不能为空。",
  "Failed to rename agent.": "重命名智能体失败。",
};

const normalizeLocale = (value: string | null | undefined): StudioLocale => {
  if (value === "zh-CN" || value === "zh") return "zh-CN";
  return DEFAULT_LOCALE;
};

const detectLocale = (): StudioLocale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const persisted = normalizeLocale(window.localStorage.getItem(STUDIO_LOCALE_STORAGE_KEY));
  if (persisted !== DEFAULT_LOCALE) return persisted;
  return normalizeLocale(window.navigator.language);
};

const translateText = (locale: StudioLocale, text: string): string => {
  if (locale !== "zh-CN") return text;
  return ZH_CN_TRANSLATIONS[text] ?? text;
};

type StudioI18nContextValue = {
  locale: StudioLocale;
  setLocale: (next: StudioLocale) => void;
  t: (text: string) => string;
};

const StudioI18nContext = createContext<StudioI18nContextValue | null>(null);

const FALLBACK_CONTEXT_VALUE: StudioI18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (text) => text,
};

export const StudioI18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<StudioLocale>(() => detectLocale());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STUDIO_LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((next: StudioLocale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (text: string) => {
      return translateText(locale, text);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <StudioI18nContext.Provider value={value}>{children}</StudioI18nContext.Provider>;
};

export const useStudioI18n = (): StudioI18nContextValue => {
  const value = useContext(StudioI18nContext);
  return value ?? FALLBACK_CONTEXT_VALUE;
};
