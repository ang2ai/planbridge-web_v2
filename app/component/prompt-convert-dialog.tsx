"use client";

import { useState } from "react";
import { Wand2, Copy, Check, Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aiApi } from "@/lib/api";

interface PromptConvertDialogProps {
  policyId: string;
  policyTitle: string;
}

export function PromptConvertDialog({ policyId, policyTitle }: PromptConvertDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (val: boolean) => {
    setOpen(val);
    if (val && !prompt) {
      setLoading(true);
      setError(null);
      try {
        const result = await aiApi.toPrompt(policyId);
        setPrompt(result.prompt);
      } catch {
        setError("프롬프트 변환에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 h-7 border-violet-200 text-violet-700 hover:bg-violet-50"
        onClick={() => handleOpen(true)}
      >
        <Wand2 className="h-3.5 w-3.5" />
        프롬프트로 변환
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-violet-600" />
              Claude Code 프롬프트 변환
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{policyTitle}</p>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>정책을 Claude Code 프롬프트로 변환 중...</span>
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => { setError(null); handleOpen(true); }}
                >
                  다시 시도
                </Button>
              </div>
            ) : prompt ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    아래 프롬프트를 복사해서 Claude Code 터미널에 붙여넣으세요
                  </p>
                  <Button
                    size="sm"
                    variant={copied ? "default" : "outline"}
                    className={`gap-1.5 text-xs ${copied ? "bg-green-600 hover:bg-green-600" : ""}`}
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        클립보드 복사
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg bg-zinc-900 p-4 overflow-auto">
                  <pre className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed font-mono">
                    {prompt}
                  </pre>
                </div>
                <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                  <p className="text-xs text-blue-700">
                    💡 <strong>사용 방법:</strong> 터미널에서 <code className="bg-blue-100 px-1 rounded">claude</code> 명령어를 실행한 후 위 프롬프트를 붙여넣으면, Claude가 해당 정책을 코드로 구현합니다.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
