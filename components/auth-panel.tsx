"use client";

import { useEffect, useState } from "react";

type CloudBaseUser = {
  uid?: string;
  nickName?: string;
  loginType?: string;
};

type CloudBaseLoginState = {
  user?: CloudBaseUser | null;
  loginType?: string;
};

type CloudBaseAuth = {
  getLoginState: () => Promise<CloudBaseLoginState | null>;
  signOut: () => Promise<void>;
  weixinAuthProvider: (options: {
    appid: string;
    scope: string;
  }) => {
    signInWithRedirect: () => void;
    getRedirectResult: (options?: {
      createUser?: boolean;
      syncUserInfo?: boolean;
    }) => Promise<CloudBaseLoginState | null>;
  };
};

type CloudBaseApp = {
  auth: (options?: { persistence?: "local" | "session" | "none" }) => CloudBaseAuth;
};

type SyncStatus = {
  message: string;
  error?: boolean;
};

const cloudBaseConfig = {
  envId: process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "",
  wechatAppId: process.env.NEXT_PUBLIC_WECHAT_APP_ID ?? "",
  scope: process.env.NEXT_PUBLIC_WECHAT_SCOPE ?? "snsapi_login",
};

function isCloudBaseConfigured() {
  return Boolean(cloudBaseConfig.envId && cloudBaseConfig.wechatAppId);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function createCloudBaseAuth() {
  const cloudbaseModule = await import("@cloudbase/js-sdk");
  const cloudbase = cloudbaseModule.default;
  const app = cloudbase.init({
    env: cloudBaseConfig.envId,
  }) as CloudBaseApp;

  return app.auth({
    persistence: "local",
  });
}

export function AuthPanel() {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<CloudBaseUser | null>(null);
  const [status, setStatus] = useState<SyncStatus>({
    message: "未登录也可以继续使用本地记录。",
  });
  const configured = isCloudBaseConfigured();

  useEffect(() => {
    let active = true;
    setMounted(true);

    if (!configured) {
      return () => {
        active = false;
      };
    }

    async function loadLoginState() {
      setBusy(true);
      try {
        const auth = await createCloudBaseAuth();
        const provider = auth.weixinAuthProvider({
          appid: cloudBaseConfig.wechatAppId,
          scope: cloudBaseConfig.scope,
        });

        const redirectState = await provider.getRedirectResult({
          createUser: true,
          syncUserInfo: cloudBaseConfig.scope !== "snsapi_base",
        });
        const loginState = redirectState ?? (await auth.getLoginState());

        if (!active) {
          return;
        }

        setUser(loginState?.user ?? null);
        setStatus({
          message: loginState?.user
            ? "已通过微信登录。当前版本仍优先保留本地记录，云同步会在下一步接入。"
            : "可以使用微信登录，为后续跨设备同步做准备。",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus({
          message: `微信登录状态读取失败：${getErrorMessage(error, "请检查 CloudBase 与微信登录配置")}`,
          error: true,
        });
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    }

    void loadLoginState();

    return () => {
      active = false;
    };
  }, [configured]);

  const handleWechatSignIn = async () => {
    if (!configured) {
      return;
    }

    setBusy(true);
    setStatus({ message: "正在前往微信登录……" });

    try {
      const auth = await createCloudBaseAuth();
      const provider = auth.weixinAuthProvider({
        appid: cloudBaseConfig.wechatAppId,
        scope: cloudBaseConfig.scope,
      });
      provider.signInWithRedirect();
    } catch (error) {
      setBusy(false);
      setStatus({
        message: `无法打开微信登录：${getErrorMessage(error, "请检查 CloudBase 环境 ID、微信 AppId 与授权域名")}`,
        error: true,
      });
    }
  };

  const handleSignOut = async () => {
    if (!configured) {
      return;
    }

    setBusy(true);
    try {
      const auth = await createCloudBaseAuth();
      await auth.signOut();
      setUser(null);
      setStatus({ message: "已退出登录，本地记录仍保留在当前浏览器中。" });
    } catch (error) {
      setStatus({
        message: `退出失败：${getErrorMessage(error, "请稍后再试")}`,
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!configured) {
    return (
      <div
        className="rounded-[24px] border border-dashed border-line/70 bg-white/55 px-4 py-3 text-xs leading-6 text-ink/65 dark:bg-white/5 dark:text-stone-200/70"
        data-testid="auth-status"
      >
        微信登录尚未配置。当前仍是本地模式，记录默认只保存在当前浏览器中。
      </div>
    );
  }

  return (
    <section className="rounded-[24px] border border-line/70 bg-white/55 px-4 py-4 text-sm text-ink/75 dark:bg-white/5 dark:text-stone-100/75">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs tracking-[0.25em] text-accent/75">SYNC</p>
          <p className="mt-1 font-serif text-lg text-ink dark:text-stone-100">可选微信登录</p>
        </div>

        {user ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-6 text-ink/65 dark:text-stone-200/70">
              已登录：{user.nickName || user.uid || "微信用户"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="soft-button" onClick={handleSignOut} disabled={busy}>
                退出登录
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button type="button" className="soft-button-primary" onClick={handleWechatSignIn} disabled={busy}>
              使用微信登录
            </button>
            <p className="text-xs leading-6 text-ink/55 dark:text-stone-200/60">
              登录用于后续同步准备；现在写下的内容仍会先保存在本地。
            </p>
          </div>
        )}

        <p
          className={`rounded-2xl px-3 py-2 text-xs leading-6 ${
            status.error ? "bg-mist/80 text-accent dark:bg-red-950/25" : "bg-rice/80 text-pine dark:bg-white/5"
          }`}
          data-testid="auth-status"
        >
          {status.message}
        </p>
      </div>
    </section>
  );
}
