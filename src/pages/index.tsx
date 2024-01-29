import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { TaskStatus } from "@prisma/client";
import { RouterOutputs, api } from "@/utils/api";
import { Button } from "@/components/ui/button";

type Task = RouterOutputs["tasks"]["getAll"][number];
interface KanbanCard {
  name: string;
  color: string;
  tasks: Task[];
}

export default function Home() {
  const { data } = api.tasks.getAll.useQuery();

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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-200">
        <AuthShowcase />
        <Button>+ New Task</Button>
        <Kanban tasks={data ?? []} />
      </main>
    </>
  );
}

const statusOptions = [
  { type: TaskStatus.BACKLOG, color: "bg-card-blue" },
  { type: TaskStatus.IN_PROGRESS, color: "bg-card-yellow" },
  { type: TaskStatus.WAITING_FOR_REVIEW, color: "bg-card-blue-2" },
  { type: TaskStatus.DONE, color: "bg-card-green" },
  { type: TaskStatus.STUCK, color: "bg-card-red" },
];

function TaskCard(props: Task) {
  return (
    <div className="mt-2 overflow-hidden rounded-lg border bg-white p-3 hover:shadow-md">
      <div className="flex justify-between p-2 font-bold capitalize text-black">
        {props.name}
      </div>
      <div className=" flex">{props.priority}</div>
    </div>
  );
}

function KanbarCard({ name, color, tasks = [] }: KanbanCard) {
  return (
    <div
      className={`bg-card-grey hover:bg-card-grey-2 w-64 overflow-hidden rounded-lg hover:shadow-md`}
    >
      <div className={`${color} z-10 p-2 font-bold capitalize text-white`}>
        {name.split("_").join(" ")} / {tasks?.length ?? 0}
      </div>
      <div className="min-h-60 px-3 pb-4 pt-1">
        {tasks?.map((task) => {
          return <TaskCard key={task.id} {...task} />;
        })}
      </div>
    </div>
  );
}

function Kanban({ tasks }: { tasks: Task[] }) {
  return (
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
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-black/10 px-10 py-3 font-semibold text-slate-200 no-underline transition hover:bg-black/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
