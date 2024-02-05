/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TaskStatus } from "@prisma/client";
import { RouterOutputs, api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Pencil1Icon, Share1Icon } from "@radix-ui/react-icons";
import Image from "next/image";
import {
  Draggable,
  Droppable,
  DragDropContext,
  DropResult,
} from "@hello-pangea/dnd";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TaskForm from "@/forms/task";

type Task = RouterOutputs["tasks"]["getAll"][number];
type Project = RouterOutputs["projects"]["getAll"][number];
type TaskWithIndex = Task & { index: number };

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
  const userData = api.users.getAll.useQuery();
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

  function TaskCard(props: TaskWithIndex) {
    const assigneeImg = userData?.data?.find(
      (user) => user.id === props.assigneeId,
    )?.image;
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
            className={`group mt-2 min-h-28 rounded-lg p-3 text-sm hover:shadow-md`}
          >
            <div className="flex items-center justify-between font-semibold capitalize text-black">
              {props.name}
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger
                    className="flex-shrink-0 cursor-pointer opacity-0 group-hover:opacity-100"
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
                <Share1Icon className="flex-shrink-0 opacity-0 group-hover:opacity-100" />
              </div>
            </div>
            <div className="mt-2 flex capitalize">
              {props.priority?.toLocaleLowerCase()}
            </div>
            <div className="mt-2">
              {assigneeImg && (
                <Image
                  src={assigneeImg}
                  alt="user.png"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
            </div>
          </Card>
        )}
      </Draggable>
    );
  }

  return <Kanban tasks={taskData.data ?? []} />;
}
