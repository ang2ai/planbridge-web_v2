import { PageHeader } from "@/components/shared/page-header";
import { NewChangeRequestWizard } from "./wizard";

export default function NewChangeRequestPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="새 변경 요청"
        description="단계별로 변경 요청을 작성하세요"
      />
      <NewChangeRequestWizard />
    </div>
  );
}
