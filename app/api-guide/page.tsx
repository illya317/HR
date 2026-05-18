"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NavLink from "@/app/components/NavLink";
import UserMenu from "@/app/components/UserMenu";
import ConfirmModal from "@/app/components/ConfirmModal";

interface User {
  id: number;
  name: string;
  username?: string | null;
  company?: string | null;
  departmentName?: string | null;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "工作台";
const API_BASE = "http://49.235.213.225:3000";

function MyApiKeyPanel({ apiKey, onApiKeyChange }: { apiKey: string | null; onApiKeyChange: (k: string | null) => void }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; onConfirm: (() => void) | null }>({ show: false, onConfirm: null });

  function openConfirm(onConfirm: () => void) {
    setConfirmModal({ show: true, onConfirm });
  }

  function closeConfirm() {
    setConfirmModal({ show: false, onConfirm: null });
  }

  async function applyApiKey() {
    const doApply = async () => {
      setLoading(true);
      const res = await fetch("/api/my-api-key", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        onApiKeyChange(data.apiKey || null);
      }
      setLoading(false);
      closeConfirm();
    };

    if (apiKey) {
      openConfirm(doApply);
    } else {
      await doApply();
    }
  }

  async function copyKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = apiKey;
      textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">我的 API</h2>
      <p className="mb-4 text-sm text-gray-500">
        每人只有一个 API Key，申请新的会自动覆盖旧的。请妥善保管，不要泄露给他人。
      </p>

      {apiKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <code className="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">
              {apiKey}
            </code>
            <button
              onClick={copyKey}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <button
            onClick={applyApiKey}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "申请中..." : "重新申请"}
          </button>
        </div>
      ) : (
        <button
          onClick={applyApiKey}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "申请中..." : "申请 API Key"}
        </button>
      )}

      <ConfirmModal
        open={confirmModal.show}
        title="确认覆盖"
        message="申请新的 API Key 将覆盖旧的 Key，确定继续？"
        onConfirm={() => confirmModal.onConfirm?.()}
        onCancel={closeConfirm}
        confirmDanger={false}
      />
    </div>
  );
}

export default function ApiGuidePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("not auth");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"));

    fetch("/api/my-api-key")
      .then((r) => r.json())
      .then((data) => setApiKey(data.apiKey || null))
      .catch(() => {});
  }, [router]);

  const authHeaders = {
    "X-API-Key": apiKey || "<your-api-key>",
    "X-Username": user?.username || user?.name || "<your-username>",
    "X-Password": password || "<your-password>",
  };

  const pwPlaceholder = password || "<your-password>";

  const mkCurl = (method: string, path: string, body?: string) => {
    const lines = [
      `curl -X ${method} ${API_BASE}${path} \\\n`,
      `  -H "Content-Type: application/json" \\\n`,
      `  -H "X-API-Key: ${authHeaders["X-API-Key"]}" \\\n`,
      `  -H "X-Username: ${authHeaders["X-Username"]}" \\\n`,
      `  -H "X-Password: ${pwPlaceholder}"${body ? " \\\\\n  -d '" + body + "'" : ""}`,
    ];
    return lines.join("");
  };

  const mkCurlGet = (path: string) => {
    return `curl "${API_BASE}${path}" \\\n  -H "X-API-Key: ${authHeaders["X-API-Key"]}" \\\n  -H "X-Username: ${authHeaders["X-Username"]}" \\\n  -H "X-Password: ${pwPlaceholder}"`;
  };

  async function copyAll() {
    const text = [
      mkCurlGet("/api/works?targetType=department&targetId=1"),
      "",
      mkCurl("POST", "/api/works", '{"category":"routine","content":"考勤统计","importance":4,"urgency":3}'),
      "",
      mkCurlGet("/api/reports?date=2026-05-18&targetType=department&targetIds=1"),
      "",
      mkCurl("POST", "/api/reports", '{"taskName":"行政人事部","date":"2026-05-18","targetType":"department","targetId":1,"items":[{"category":"routine","plan":"考勤统计","completion":"已完成","nextGoal":"继续跟进","sortOrder":0}]}'),
      "",
      mkCurl("PUT", "/api/reports/1", '{"taskName":"行政人事部","notes":"","items":[]}'),
      "",
      mkCurlGet("/api/employees?status=在职&company=丰华生物"),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/company/logo.png" alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "公司"} width={100} height={30} className="h-auto w-auto max-w-[100px] object-contain" />
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/portal")}
              className="text-sm text-gray-500 hover:text-emerald-600"
            >
              返回入口
            </button>
            <NavLink href="/reports">填写周报</NavLink>
            <NavLink href="/works">工作清单</NavLink>
            <NavLink href="/history">历史记录</NavLink>
            <UserMenu user={user} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">API 接入指南</h1>
          <button
            onClick={copyAll}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
          >
            {copied ? "已复制" : "一键复制全部示例"}
          </button>
        </div>

        <MyApiKeyPanel apiKey={apiKey} onApiKeyChange={setApiKey} />

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">认证方式</h2>
            <p className="mb-3 text-sm text-gray-600">
              机器人或外部系统可通过 API 接入，与网页版权限一致。所有请求需同时提供以下三个 header：
            </p>
            <div className="rounded-md bg-emerald-50 p-4 font-mono text-sm text-emerald-800 space-y-1">
              <div>X-API-Key: {apiKey || "（请先上方申请 API Key）"}</div>
              <div>X-Username: {user?.username || user?.name || "（未获取到用户名）"}</div>
              <div className="flex items-center gap-2">
                <span>X-Password:</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="在此输入你的密码"
                  className="rounded border border-emerald-300 bg-white px-2 py-0.5 text-sm text-gray-800 placeholder:text-emerald-300 focus:border-emerald-500 focus:outline-none"
                />
                {!password && <span className="text-xs text-red-500">（必填，输入后示例自动填充）</span>}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">1. 查看工作清单</h2>
            <p className="mb-2 text-xs text-gray-500">参数：targetType + targetId（可选 category、includeArchived）</p>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
{mkCurlGet("/api/works?targetType=department&targetId=1")}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">2. 创建工作项（需管理员权限）</h2>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
{mkCurl("POST", "/api/works", '{"category":"routine","content":"考勤统计","importance":4,"urgency":3}')}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">3. 查看周报</h2>
            <p className="mb-2 text-xs text-gray-500">参数：date + targetType + targetIds</p>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
{mkCurlGet("/api/reports?date=2026-05-18&targetType=department&targetIds=1")}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">4. 提交周报</h2>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
{mkCurl("POST", "/api/reports", '{"taskName":"行政人事部","date":"2026-05-18","targetType":"department","targetId":1,"items":[{"category":"routine","plan":"考勤统计","completion":"已完成","nextGoal":"继续跟进","sortOrder":0}]}')}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">5. 更新周报</h2>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
{mkCurl("PUT", "/api/reports/1", '{"taskName":"行政人事部","notes":"","items":[]}')}
            </pre>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">6. 查看员工列表（需HR权限）</h2>
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 font-mono text-xs text-gray-100">
{mkCurlGet("/api/employees?status=在职&company=丰华生物")}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
