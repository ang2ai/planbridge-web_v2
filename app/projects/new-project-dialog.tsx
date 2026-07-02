"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectsApi } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const FRAMEWORKS = [
  { value: "NEXTJS", label: "Next.js" },
  { value: "REACT", label: "React" },
  { value: "VUE", label: "Vue" },
];

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    projectName: "",
    projectDesc: "",
    framework: "",
    repoUrl: "",
    repoBranch: "",
    baseUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName) return;
    setLoading(true);
    try {
      await projectsApi.create({
        projectName: form.projectName,
        projectDesc: form.projectDesc || undefined,
        framework: form.framework || undefined,
        repoUrl: form.repoUrl || undefined,
        repoBranch: form.repoBranch || undefined,
        baseUrl: form.baseUrl || undefined,
        createdBy: "user",
      });
      setOpen(false);
      setForm({ projectName: "", projectDesc: "", framework: "", repoUrl: "", repoBranch: "", baseUrl: "" });
      toast.success("프로젝트가 생성됐습니다.");
      router.refresh();
    } catch (err) {
      console.error("Failed to create project:", err);
      toast.error("프로젝트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="mr-2 h-4 w-4" />
        새 프로젝트
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 프로젝트 등록</DialogTitle>
            <DialogDescription>
              정책과 변경 요청을 관리할 프로젝트를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="projectName">프로젝트명 *</Label>
              <Input
                id="projectName"
                placeholder="예: 쇼핑몰 프론트엔드"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projectDesc">설명</Label>
              <Input
                id="projectDesc"
                placeholder="프로젝트 설명 (선택)"
                value={form.projectDesc}
                onChange={(e) => setForm({ ...form, projectDesc: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="framework">프레임워크</Label>
              <Select
                value={form.framework || undefined}
                onValueChange={(v) => setForm({ ...form, framework: v ?? "" })}
              >
                <SelectTrigger id="framework">
                  <SelectValue placeholder="프레임워크 선택" />
                </SelectTrigger>
                <SelectContent>
                  {FRAMEWORKS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repoUrl">저장소 URL</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/org/repo (선택)"
                value={form.repoUrl}
                onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repoBranch">브랜치</Label>
              <Input
                id="repoBranch"
                placeholder="main (선택)"
                value={form.repoBranch}
                onChange={(e) => setForm({ ...form, repoBranch: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">서비스 URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://example.com (선택)"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={loading || !form.projectName}>
              {loading ? "등록 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


