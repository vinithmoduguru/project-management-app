import { api } from "@/utils/api";
import { useRouter } from "next/router";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormField,
} from "@/components/ui/form";
import TaskForm from "@/forms/task";
import { Label } from "@/components/ui/label";
export default function TaskPage() {
  const {
    query: { taskId },
  } = useRouter();
  const { data, isLoading } = api.tasks.getById.useQuery({
    id: parseInt(taskId as string),
  });

  return (
    // Simple Form page Task, description and comments
    isLoading && data ? (
      <div>Loading...</div>
    ) : (
      <>
        <h1 className="mb-6 text-xl font-bold">{data?.name}</h1>
        <Label className="font-semibold">Description</Label>
        <div className="mt-1">{data?.description}</div>
      </>
    )
  );
}
