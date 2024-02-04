/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { TaskStatus, Priority } from "@prisma/client";
import { RouterOutputs, api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Pencil1Icon } from "@radix-ui/react-icons";

import {
  Draggable,
  Droppable,
  DragDropContext,
  DropResult,
} from "@hello-pangea/dnd";
import { useEffect, useState } from "react";
import { Figtree } from "@next/font/google";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Close } from "@radix-ui/react-popover";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";

type Task = RouterOutputs["tasks"]["getAll"][number];
type Project = RouterOutputs["projects"]["getAll"][number];
type TaskWithIndex = Task & { index: number };

const figTree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const statusOptions = [
  { type: TaskStatus.BACKLOG, color: "bg-kanban-blue" },
  { type: TaskStatus.IN_PROGRESS, color: "bg-kanban-yellow" },
  { type: TaskStatus.WAITING_FOR_REVIEW, color: "bg-kanban-blue2" },
  { type: TaskStatus.DONE, color: "bg-kanban-green" },
  { type: TaskStatus.STUCK, color: "bg-kanban-red" },
];

interface KanbanCard {
  name: string;
  color: string;
  tasks: Task[];
}

interface TaskForm {
  task?: Task;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[] | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project>();
  const projectData = api.projects.getAll.useQuery();
  const taskData = api.tasks.getAll.useQuery({
    projectId: selectedProject?.id ?? 1,
  });
  const utils = api.useUtils();

  useEffect(() => {
    if (projectData.data) {
      setProjects(projectData.data);
      setSelectedProject(projectData.data[0]);
    }
  }, [projectData.data]);

  useEffect(() => {
    if (selectedProject) {
      void utils.tasks.getAll.invalidate();
    }
  }, [selectedProject]);

  function Kanban({ tasks }: { tasks: Task[] }) {
    const utils = api.useUtils();
    const mutate = api.tasks.update.useMutation({
      onSuccess: () => {
        void utils.tasks.getAll.invalidate();
      },
    });
    const onDragEnd = (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      mutate.mutate({
        id: parseInt(draggableId),
        status: destination.droppableId as TaskStatus,
      });
    };
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-2">
          {statusOptions.map(({ type, color }) => {
            const groupedTasks: Task[] = tasks?.filter(
              (task: Task) => task.status === type,
            );
            return (
              <KanbarCard
                key={type}
                name={type}
                color={color}
                tasks={groupedTasks}
              />
            );
          })}
        </div>
      </DragDropContext>
    );
  }

  function KanbarCard({ name, color, tasks = [] }: KanbanCard) {
    return (
      <div
        className={`max-h-screen w-64 overflow-y-hidden rounded-lg bg-kanban-grey hover:bg-kanban-grey2 hover:shadow-md`}
      >
        <div
          className={`${color} z-10 rounded-t-xl p-2 font-bold capitalize text-white`}
        >
          {name.split("_").join(" ").toLocaleLowerCase()} / {tasks?.length ?? 0}
        </div>

        <Droppable droppableId={`${name}`}>
          {(provided): JSX.Element => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="max-h-screen min-h-60 overflow-auto px-3 pb-4 pt-1"
            >
              {tasks?.map((task, index) => {
                return (
                  <TaskCard
                    key={`task_${task.projectId}_${task.id}`}
                    index={index}
                    {...task}
                  />
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }

  function TaskForm(props: TaskForm) {
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
    console.log("====================================");
    console.log(selectedProject?.id);
    console.log("====================================");

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
      // projectId: z.number(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: props.task?.name ?? "",
        description: props.task?.description ?? "",
        status: props.task?.status ?? "BACKLOG",
        priority: props.task?.priority ?? "MEDIUM",
        type: props.task?.type ?? "",
        // projectId: props.task?.projectId,
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
        });
      } else {
        create.mutate({
          name: values.name,
          description: values.description,
          status: values.status,
          priority: values.priority,
          createdById: sessionData?.user?.id ?? "",
          projectId: selectedProject?.id ?? 1,
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
          {/* <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} value={`${field.value}`}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project for the Task" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects?.map((project, index) => (
                      <SelectItem
                        key={`${project.name}.name_${index}`}
                        value={`${field.value}`}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          /> */}
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
          {/* <Close> */}
          <Button type="submit">Submit</Button>
          {/* </Close> */}
        </form>
      </Form>
    );
  }

  function ProjectForm() {
    const utils = api.useUtils();
    const create = api.projects.create.useMutation({
      onSuccess: () => {
        void utils.projects.getAll.invalidate();
      },
    });
    const formSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: "",
        description: "",
      },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
      create.mutate({
        name: values.name,
        description: values?.description ?? "",
      });
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
                  <Input placeholder="Enter name of the project" {...field} />
                </FormControl>
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
          <Close>
            <Button type="submit">Submit</Button>
          </Close>
        </form>
      </Form>
    );
  }

  function TaskCard(props: TaskWithIndex) {
    return (
      <Draggable draggableId={`${props.id}`} index={props.index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              transform: `${provided.draggableProps.style?.transform ?? ""} ${snapshot.isDragging ? "rotate(3deg)" : ""}`,
            }}
            className={`group mt-2 max-h-28 min-h-28 rounded-lg p-3 text-sm hover:shadow-md`}
          >
            <div className="flex items-center justify-between font-semibold capitalize text-black">
              {props.name}
              <Popover>
                <PopoverTrigger
                  className="cursor-pointer opacity-0 group-hover:opacity-100"
                  asChild
                >
                  <Pencil1Icon />
                </PopoverTrigger>
                <PopoverContent>
                  <TaskForm
                    key={`edit_${props.projectId}_${props.id}`}
                    task={props}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="mt-2 flex capitalize">
              {props.priority?.toLocaleLowerCase()}
            </div>
          </Card>
        )}
      </Draggable>
    );
  }

  return (
    <>
      <Head>
        <title>Project Management App</title>
        <meta
          name="description"
          content="Generated by project-management-app"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={`grid-areas-layout grid-cols-layout grid-rows-layout grid h-full bg-white ${figTree.className}`}
      >
        <header className="grid-in-header px-3 py-2">
          <div className="flex items-center justify-between">
            <AuthShowcase />
            <Popover>
              <PopoverTrigger asChild>
                <Button>+ New Task</Button>
              </PopoverTrigger>
              <PopoverContent>
                <TaskForm />
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <div className="grid-in-nav px-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="projects" className="gap-x-3">
              <AccordionTrigger className="flex-row-reverse justify-end gap-3">
                Projects
              </AccordionTrigger>
              <AccordionContent>
                {projects?.map((project) => (
                  <div
                    key={`project_${project.id}`}
                    className={`cursor-pointer py-3 pl-6 pr-3 text-sm hover:bg-kanban-grey2 ${selectedProject?.id === project.id ? "bg-gray-200 font-semibold" : ""} `}
                    onClick={() => setSelectedProject(project)}
                  >
                    {project.name}
                  </div>
                ))}
                <Popover>
                  <PopoverTrigger
                    className="cursor-pointer text-sm underline"
                    asChild
                  >
                    <div className="ml-4 mt-2 flex">Add Project</div>
                  </PopoverTrigger>
                  <PopoverContent side="right">
                    <ProjectForm />
                  </PopoverContent>
                </Popover>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="grid-in-main mr-3">
          <Kanban tasks={taskData.data ?? []} />
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();
  return (
    <div>
      <Button
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </Button>
      <p className=" text-center text-sm text-black">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
    </div>
  );
}
