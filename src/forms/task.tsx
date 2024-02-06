/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { api } from "@/utils/api";
import type { RouterOutputs } from "@/utils/api";
import { TaskStatus, Priority } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Close } from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Task = RouterOutputs["tasks"]["getAll"][number];
interface TaskForm {
  task?: Task;
  projectId?: number;
}

export default function TaskForm(props: TaskForm) {
  const utils = api.useUtils();
  const create = api.tasks.create.useMutation({
    onSuccess: () => {
      void utils.tasks.getAll.invalidate();
    },
  });
  const update = api.tasks.update.useMutation({
    onSuccess: () => {
      void utils.tasks.getAll.invalidate();
    },
  });
  const { data: sessionData } = useSession();

  const projectData = api.projects.getAll.useQuery();
  const userData = api.users.getAll.useQuery();

  const statusOptions = [
    { type: TaskStatus.BACKLOG, color: "bg-kanban-blue" },
    { type: TaskStatus.IN_PROGRESS, color: "bg-kanban-yellow" },
    { type: TaskStatus.WAITING_FOR_REVIEW, color: "bg-kanban-blue2" },
    { type: TaskStatus.DONE, color: "bg-kanban-green" },
    { type: TaskStatus.STUCK, color: "bg-kanban-red" },
  ];

  const formSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum([
      "BACKLOG",
      "IN_PROGRESS",
      "WAITING_FOR_REVIEW",
      "DONE",
      "STUCK",
    ]),
    priority: z.enum(["HIGH", "MEDIUM", "LOW", "CRITICAL"]),
    type: z.string().optional(),
    assignee: z.string().optional(),
    projectId: z.number(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: props.task?.name ?? "",
      description: props.task?.description ?? "",
      status: props.task?.status ?? "BACKLOG",
      priority: props.task?.priority ?? "MEDIUM",
      type: props.task?.type ?? "",
      projectId: props.task?.projectId,
      assignee: props.task?.assigneeId ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (props.task?.id) {
      update.mutate({
        id: props.task.id,
        name: values.name,
        description: values.description,
        status: values.status,
        priority: values.priority,
        projectId: values.projectId,
        assigneeId: values.assignee,
      });
    } else {
      create.mutate({
        name: values.name,
        description: values.description,
        status: values.status,
        priority: values.priority,
        createdById: sessionData?.user?.id ?? "",
        projectId: values.projectId,
        assigneeId: values.assignee,
      });
    }
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name of the task" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assignee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignee</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Assignee for the Task" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userData?.data?.map((user) => (
                    <SelectItem
                      key={user.id}
                      className="capitalize"
                      value={user.id}
                    >
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(parseInt(val));
                }}
                value={`${field.value}`}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project for the Task" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projectData?.data?.map((project, index) => (
                    <SelectItem
                      key={`${project.name}.name_${index}`}
                      value={`${project.id}`}
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter Description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status for the Task" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.type} value={option.type}>
                      {option.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority for the Task" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.keys(Priority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Close>
          <Button type="submit">Submit</Button>
        </Close>
      </form>
    </Form>
  );
}
