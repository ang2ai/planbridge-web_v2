import { PageHeader } from "@/components/shared/page-header";
import { todosApi, type Todo } from "@/lib/api";
import { TodoBoard } from "./todo-board";

async function getTodos(): Promise<Todo[]> {
  try {
    return await todosApi.list();
  } catch {
    return [];
  }
}

export default async function TodosPage() {
  const todos = await getTodos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="TODO Board"
        description="AI-generated tasks from change requests"
      />
      <TodoBoard initialTodos={todos} />
    </div>
  );
}
