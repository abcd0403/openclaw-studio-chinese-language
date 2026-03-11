import { useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import type { GatewayStatus } from "@/lib/gateway/gateway-status";
import { useStudioI18n } from "@/lib/i18n/studioI18n";
import {
  isStudioLikelyRemote,
  resolveDefaultSetupScenario,
  resolveGatewayConnectionWarnings,
  type StudioConnectionWarning,
  type StudioInstallContext,
  type StudioSetupScenario,
} from "@/lib/studio/install-context";
import type { StudioGatewaySettings } from "@/lib/studio/settings";
import { resolveGatewayStatusBadgeClass, resolveGatewayStatusLabel } from "./colorSemantics";

type GatewayConnectScreenProps = {
  savedGatewayUrl: string;
  draftGatewayUrl: string;
  token: string;
  localGatewayDefaults: StudioGatewaySettings | null;
  localGatewayDefaultsHasToken: boolean;
  hasStoredToken: boolean;
  hasUnsavedChanges: boolean;
  installContext: StudioInstallContext;
  status: GatewayStatus;
  statusReason: string | null;
  error: string | null;
  testResult:
    | {
        kind: "success" | "error";
        message: string;
      }
    | null;
  saving: boolean;
  testing: boolean;
  onGatewayUrlChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  onUseLocalDefaults: () => void;
  onSaveSettings: () => void;
  onTestConnection: () => void;
  onDisconnect: () => void;
};

const resolveLocalGatewayPort = (gatewayUrl: string): number => {
  try {
    const parsed = new URL(gatewayUrl);
    const port = Number(parsed.port);
    if (Number.isFinite(port) && port > 0) return port;
  } catch {}
  return 18789;
};

export const GatewayConnectScreen = ({
  savedGatewayUrl,
  draftGatewayUrl,
  token,
  localGatewayDefaults,
  localGatewayDefaultsHasToken,
  hasStoredToken,
  hasUnsavedChanges,
  installContext,
  status,
  statusReason,
  error,
  testResult,
  saving,
  testing,
  onGatewayUrlChange,
  onTokenChange,
  onUseLocalDefaults,
  onSaveSettings,
  onTestConnection,
  onDisconnect,
}: GatewayConnectScreenProps) => {
  const { locale, t } = useStudioI18n();
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [showToken, setShowToken] = useState(false);
  const inferredScenario = useMemo(
    () =>
      resolveDefaultSetupScenario({
        installContext,
        gatewayUrl: draftGatewayUrl || savedGatewayUrl,
      }),
    [draftGatewayUrl, installContext, savedGatewayUrl]
  );
  const [manualScenario, setManualScenario] = useState<StudioSetupScenario | null>(null);
  const selectedScenario = manualScenario ?? inferredScenario;
  const localPort = useMemo(
    () => resolveLocalGatewayPort(draftGatewayUrl || savedGatewayUrl),
    [draftGatewayUrl, savedGatewayUrl]
  );
  const localGatewayCommand = useMemo(
    () => `openclaw gateway --port ${localPort}`,
    [localPort]
  );
  const gatewayServeCommand = useMemo(
    () => `tailscale serve --yes --bg --https 443 http://127.0.0.1:${localPort}`,
    [localPort]
  );
  const studioServeCommand = "tailscale serve --yes --bg --https 443 http://127.0.0.1:3000";
  const studioOpenUrl = installContext.tailscale.loggedIn && installContext.tailscale.dnsName
    ? `https://${installContext.tailscale.dnsName}`
    : "https://<studio-host>.ts.net";
  const studioSshTarget =
    installContext.tailscale.dnsName ||
    installContext.studioHost.publicHosts[0] ||
    "<studio-host>";
  const studioTunnelCommand = `ssh -L 3000:127.0.0.1:3000 ${studioSshTarget}`;
  const gatewayTunnelCommand = `ssh -L ${localPort}:127.0.0.1:${localPort} user@<gateway-host>`;
  const warnings = useMemo<StudioConnectionWarning[]>(
    () =>
      resolveGatewayConnectionWarnings({
        gatewayUrl: draftGatewayUrl,
        installContext,
        scenario: selectedScenario,
        hasStoredToken,
        hasLocalGatewayToken: localGatewayDefaultsHasToken,
      }),
    [
      draftGatewayUrl,
      hasStoredToken,
      installContext,
      localGatewayDefaultsHasToken,
      selectedScenario,
    ]
  );
  const studioCliUpdateWarning = useMemo(() => {
    const studioCli = installContext.studioCli;
    if (!studioCli.installed || !studioCli.updateAvailable) return null;
    const current = studioCli.currentVersion?.trim() || "current";
    const latest = studioCli.latestVersion?.trim() || "latest";
    if (locale === "zh-CN") {
      return `此主机已安装 openclaw-studio CLI ${current}，但有更新版本 ${latest}。请运行 npx -y openclaw-studio@latest 更新。`;
    }
    return `openclaw-studio CLI ${current} is installed on this host, but ${latest} is available. Run npx -y openclaw-studio@latest to update.`;
  }, [installContext, locale]);
  const statusCopy = useMemo(() => {
    if (status === "connected") {
      return locale === "zh-CN" ? "Studio 已连接到 OpenClaw。" : "Studio is connected to OpenClaw.";
    }
    if (status === "connecting") {
      return locale === "zh-CN" ? "Studio 正在连接 OpenClaw…" : "Studio is connecting to OpenClaw…";
    }
    if (status === "reconnecting") {
      return locale === "zh-CN"
        ? "Studio 与网关的连接已断开，正在重试…"
        : "Studio lost the gateway connection and is retrying…";
    }
    if (status === "error") {
      return locale === "zh-CN"
        ? "Studio 无法使用已保存的网关设置建立连接。"
        : "Studio could not connect to the saved gateway settings.";
    }
    return locale === "zh-CN"
      ? "请选择此 Studio 连接 OpenClaw 的方式。"
      : "Choose how this Studio should reach OpenClaw.";
  }, [locale, status]);
  const statusSubcopy = useMemo(() => {
    const normalizedReason = statusReason?.trim() ?? "";
    if (normalizedReason === "gateway_closed") {
      return locale === "zh-CN"
        ? "网关套接字已关闭。Studio 会持续重试直到重连成功。"
        : "The gateway socket closed. Studio will keep retrying until it reconnects.";
    }
    if (normalizedReason) return normalizedReason;
    if (selectedScenario === "same-cloud-host") {
      return locale === "zh-CN"
        ? "请区分两条链路：你如何访问 Studio，以及 Studio 如何连接 OpenClaw。"
        : "Separate the two links: how you open Studio, and how Studio reaches OpenClaw.";
    }
    if (selectedScenario === "remote-gateway") {
      return locale === "zh-CN"
        ? "在你的电脑上，Studio 保持本地；只需要把上游网关放在远程。"
        : "On your laptop, Studio stays local. Only the upstream gateway needs to be remote.";
    }
    return locale === "zh-CN"
      ? "当 Studio 与 OpenClaw 在同一主机时，上游通常应保持为 localhost。"
      : "When Studio and OpenClaw share a host, the upstream should usually stay on localhost.";
  }, [locale, selectedScenario, statusReason]);
  const actionBusy = saving || testing;
  const saveLabel = saving ? t("Saving…") : t("Save settings");
  const testLabel = testing ? t("Testing…") : t("Test connection");
  const statusDotClass =
    status === "connected"
      ? "ui-dot-status-connected"
      : status === "connecting" || status === "reconnecting"
        ? "ui-dot-status-connecting"
        : "ui-dot-status-disconnected";
  const tokenHelper = hasStoredToken
    ? t("A token is already stored on this Studio host. Leave this blank to keep it.")
    : localGatewayDefaultsHasToken
      ? t("A local OpenClaw token is available on this host. Leave this blank to use it.")
      : t("Enter the gateway token Studio should use.");
  const remoteStudio = isStudioLikelyRemote(installContext);

  const setScenario = (value: StudioSetupScenario) => {
    setManualScenario(value);
  };

  const applyLoopbackUrl = () => {
    onGatewayUrlChange(`ws://localhost:${localPort}`);
  };

  const copyCommand = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1200);
    } catch {
      setCopyStatus("failed");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    }
  };

  const commandField = (params: {
    value: string;
    label: string;
    helper?: string;
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
          {params.label}
        </p>
        <button
          type="button"
          className="ui-btn-ghost h-7 px-2 text-[11px]"
          onClick={() => void copyCommand(params.value)}
        >
          {copyStatus === "copied" ? t("Copied") : copyStatus === "failed" ? t("Copy failed") : t("Copy")}
        </button>
      </div>
      <div className="ui-command-surface flex items-center gap-2 rounded-md px-3 py-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[12px]">
          {params.value}
        </code>
        <button
          type="button"
          className="ui-btn-icon ui-command-copy h-7 w-7 shrink-0"
          onClick={() => void copyCommand(params.value)}
          aria-label={`${t("Copy")} ${params.label}`}
          title={t("Copy command")}
        >
          {copyStatus === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      {params.helper ? (
        <p className="text-xs leading-snug text-muted-foreground">{params.helper}</p>
      ) : null}
    </div>
  );

  const scenarioButtonClass = (scenario: StudioSetupScenario): string => {
    return `ui-card rounded-xl px-4 py-3 text-left transition ${
      selectedScenario === scenario
        ? "ui-card-selected border-primary/60"
        : "border border-border/70 hover:border-border"
    }`;
  };

  const connectionForm = (
    <div className="ui-card px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {t("Studio to OpenClaw")}
          </p>
          <p className="mt-1 text-sm text-foreground/85">
            {t("Save a gateway URL and token for this Studio host.")}
          </p>
        </div>
        <span
          className={`ui-chip inline-flex items-center px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.08em] ${resolveGatewayStatusBadgeClass(status)}`}
          data-status={status}
        >
          {t(resolveGatewayStatusLabel(status))}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <label className="flex flex-col gap-1 text-[11px] font-medium text-foreground/80">
          {t("Upstream URL")}
          <input
            className="ui-input h-10 rounded-md px-4 font-sans text-sm text-foreground outline-none"
            type="text"
            value={draftGatewayUrl}
            onChange={(event) => onGatewayUrlChange(event.target.value)}
            placeholder={
              selectedScenario === "remote-gateway"
                ? "wss://your-gateway.ts.net"
                : `ws://localhost:${localPort}`
            }
            spellCheck={false}
          />
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-medium text-foreground/80">
          {t("Upstream token")}
          <div className="relative">
            <input
              className="ui-input h-10 w-full rounded-md px-4 pr-10 font-sans text-sm text-foreground outline-none"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(event) => onTokenChange(event.target.value)}
              placeholder={
                hasStoredToken || localGatewayDefaultsHasToken ? t("keep existing token") : t("gateway token")
              }
              spellCheck={false}
            />
            <button
              type="button"
              className="ui-btn-icon absolute inset-y-0 right-1 my-auto h-8 w-8 border-transparent bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"
              aria-label={showToken ? t("Hide token") : t("Show token")}
              onClick={() => setShowToken((prev) => !prev)}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
      </div>

      <p className="mt-2 text-xs leading-snug text-muted-foreground">{tokenHelper}</p>

      {hasUnsavedChanges ? (
        <p className="mt-2 font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
          {t("Unsaved changes")}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="ui-btn-primary h-10 px-4 text-xs font-semibold tracking-[0.05em] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onSaveSettings()}
          disabled={actionBusy || !draftGatewayUrl.trim()}
        >
          {saveLabel}
        </button>
        <button
          type="button"
          className="ui-btn-secondary h-10 px-4 text-xs font-semibold tracking-[0.05em] text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void onTestConnection()}
          disabled={actionBusy || !draftGatewayUrl.trim()}
        >
          {testLabel}
        </button>
        {status === "connected" ? (
          <button
            type="button"
            className="ui-btn-ghost h-10 px-4 text-xs font-semibold tracking-[0.05em] text-foreground"
            onClick={() => void onDisconnect()}
            disabled={actionBusy}
          >
            {t("Disconnect")}
          </button>
        ) : null}
      </div>
    </div>
  );
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[820px] flex-1 flex-col gap-5">
      <div className="ui-card px-4 py-2">
        <div className="flex items-start gap-3">
          {status === "connecting" || status === "reconnecting" ? (
            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--status-connecting-fg)]" />
          ) : (
            <span className={`mt-1 h-2.5 w-2.5 ${statusDotClass}`} />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{statusCopy}</p>
            <p className="text-sm text-muted-foreground">{statusSubcopy}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <button type="button" className={scenarioButtonClass("same-computer")} onClick={() => setScenario("same-computer")}>
          <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {t("Everything on this computer")}
          </p>
          <p className="mt-2 text-sm text-foreground/85">
            {t("Studio and OpenClaw both run on the same machine.")}
          </p>
        </button>
        <button type="button" className={scenarioButtonClass("remote-gateway")} onClick={() => setScenario("remote-gateway")}>
          <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {t("Studio here, OpenClaw in the cloud")}
          </p>
          <p className="mt-2 text-sm text-foreground/85">
            {t("Keep Studio on your laptop and point it at a remote gateway.")}
          </p>
        </button>
        <button type="button" className={scenarioButtonClass("same-cloud-host")} onClick={() => setScenario("same-cloud-host")}>
          <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {t("Studio and OpenClaw on the same cloud machine")}
          </p>
          <p className="mt-2 text-sm text-foreground/85">
            {t("Use localhost for the upstream, then solve how you open Studio.")}
          </p>
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="ui-card px-4 py-4 sm:px-5">
          <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {t("How you open Studio")}
          </p>
          {selectedScenario === "same-computer" || selectedScenario === "remote-gateway" ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-foreground/85">
                {locale === "zh-CN" ? "请在当前电脑打开 " : "Open "}
                <span className="font-mono">http://localhost:3000</span>
                {locale === "zh-CN" ? "。" : " on this computer."}
              </p>
              <p className="text-xs leading-snug text-muted-foreground">
                {t("Only the OpenClaw upstream changes in this setup. Studio itself stays local.")}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-foreground/85">
                {locale === "zh-CN" ? (
                  <>
                    Studio 位于远程主机上。<span className="font-mono">http://localhost:3000</span> 只能在该主机上访问。
                  </>
                ) : (
                  <>
                    Studio is on a remote host. <span className="font-mono">http://localhost:3000</span> only opens on that machine.
                  </>
                )}
              </p>
              {commandField({
                value: studioServeCommand,
                label: t("Recommended: Tailscale Serve"),
                helper:
                  locale === "zh-CN"
                    ? `然后在你的电脑或手机上打开 ${studioOpenUrl}。`
                    : `Then open ${studioOpenUrl} from your laptop or phone.`,
              })}
              {commandField({
                value: studioTunnelCommand,
                label: t("Fallback: SSH tunnel"),
                helper: t("Use this if Tailscale is not available yet."),
              })}
              {remoteStudio && installContext.tailscale.loggedIn === false ? (
                <div className="ui-card rounded-md px-3 py-3 text-sm text-muted-foreground">
                  {locale === "zh-CN"
                    ? "此 Studio 主机未检测到 Tailscale。对大多数用户来说，Tailscale Serve 通常比公网绑定更简单。"
                    : "Tailscale was not detected on this Studio host. Beginners will usually have a much easier time with Tailscale Serve than with public binds."}
                </div>
              ) : null}
              {installContext.studioHost.publicHosts.length > 0 ? (
                <div className="ui-card rounded-md px-3 py-3 text-sm text-muted-foreground">
                  {locale === "zh-CN" ? (
                    <>
                      当前 Studio 已绑定到非回环地址。若继续公网访问，必须配置
                      {" "}
                      <span className="font-mono">STUDIO_ACCESS_TOKEN</span>
                      {" "}
                      ，且每个浏览器首次需打开
                      {" "}
                      <span className="font-mono">/?access_token=...</span>
                      。
                    </>
                  ) : (
                    <>
                      This Studio is already bound beyond loopback. If you keep it public, <span className="font-mono">STUDIO_ACCESS_TOKEN</span> is required and each browser must open <span className="font-mono">/?access_token=...</span> once.
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="ui-card px-4 py-4 sm:px-5">
          <p className="font-mono text-[10px] font-semibold tracking-[0.06em] text-muted-foreground">
            {t("How Studio reaches OpenClaw")}
          </p>
          {selectedScenario === "remote-gateway" ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-foreground/85">
                {t("Recommended: keep the remote gateway on loopback and expose it with Tailscale Serve.")}
              </p>
              {commandField({
                value: gatewayServeCommand,
                label: t("On the gateway host"),
                helper:
                  locale === "zh-CN"
                    ? "在 Studio 中填写 wss://<gateway-host>.ts.net，并使用你的网关 token。"
                    : "In Studio, use wss://<gateway-host>.ts.net plus your gateway token.",
              })}
              {commandField({
                value: gatewayTunnelCommand,
                label: t("Fallback: SSH tunnel"),
                helper:
                  locale === "zh-CN"
                    ? `然后将 Studio 指向 ws://localhost:${localPort}。`
                    : `Then point Studio to ws://localhost:${localPort}.`,
              })}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-btn-secondary h-9 px-3 text-xs font-semibold tracking-[0.05em] text-foreground"
                  onClick={applyLoopbackUrl}
                >
                  {t("Use SSH tunnel URL")}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-foreground/85">
                {t("Keep the upstream local to the Studio host:")}{" "}
                <span className="font-mono">{`ws://localhost:${localPort}`}</span>.
              </p>
              {commandField({
                value: localGatewayCommand,
                label: t("Start OpenClaw on this host"),
                helper: t("Use the same machine for both processes, even if that machine is a cloud VM."),
              })}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-btn-secondary h-9 px-3 text-xs font-semibold tracking-[0.05em] text-foreground"
                  onClick={applyLoopbackUrl}
                >
                  {t("Use localhost upstream")}
                </button>
                {localGatewayDefaults ? (
                  <button
                    type="button"
                    className="ui-btn-secondary h-9 px-3 text-xs font-semibold tracking-[0.05em] text-foreground"
                    onClick={onUseLocalDefaults}
                  >
                    {t("Use local defaults")}
                  </button>
                ) : null}
              </div>
              {localGatewayDefaults ? (
                <div className="ui-card rounded-md px-3 py-3 text-sm text-muted-foreground">
                  {t("Local OpenClaw settings were detected at")}{" "}
                  <span className="font-mono">~/.openclaw/openclaw.json</span>.{" "}
                  {t("Studio can reuse that local URL and token.")}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {studioCliUpdateWarning ? (
        <div className="ui-alert-danger rounded-md px-4 py-2 text-sm">
          {studioCliUpdateWarning}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="space-y-2">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className={
                warning.tone === "warn"
                  ? "ui-alert-danger rounded-md px-4 py-2 text-sm"
                  : "ui-card rounded-md px-4 py-2 text-sm text-muted-foreground"
              }
            >
              {warning.message}
            </div>
          ))}
        </div>
      ) : null}

      {connectionForm}

      {testResult ? (
        <div
          className={
            testResult.kind === "error"
              ? "ui-alert-danger rounded-md px-4 py-2 text-sm"
              : "ui-card rounded-md px-4 py-2 text-sm text-muted-foreground"
          }
        >
          {testResult.message}
        </div>
      ) : null}

      {error ? <p className="ui-text-danger text-sm leading-snug">{error}</p> : null}
    </div>
  );
};
