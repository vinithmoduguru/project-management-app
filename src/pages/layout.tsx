import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import { Figtree } from "@next/font/google";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import TaskForm from "@/forms/task";
import ProjectForm from "@/forms/project";
import { api } from "@/utils/api";
import Link from "next/link";
import { useRouter } from "next/router";
import { Toaster } from "@/components/ui/toaster";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const figTree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const { query } = useRouter(),
    projectId = parseInt(query?.projectId as string);

  const projectData = api.projects.getAll.useQuery();
  return (
    <div
      className={`grid-areas-layout grid-cols-layout grid-rows-layout grid h-full bg-white ${figTree.className}`}
    >
      <header className="grid-in-header bg-backgroundGreen mb-2 px-3 py-2">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold">Project Management</div>
          <div className="flex-grow">
            <Popover>
              <PopoverTrigger asChild>
                <Button>+ New Task</Button>
              </PopoverTrigger>
              <PopoverContent>
                <TaskForm />
              </PopoverContent>
            </Popover>
          </div>
          <AuthShowcase />
        </div>
      </header>
      <div className="grid-in-nav mr-4 border-r px-3">
        <Accordion type="single" collapsible defaultValue="projects">
          <AccordionItem value="projects" className="gap-x-3">
            <AccordionTrigger className="flex-row-reverse justify-end gap-3">
              Projects
            </AccordionTrigger>
            <AccordionContent>
              {projectData?.data?.map((project) => (
                <Link
                  href={`/project/${project.id}`}
                  key={`project_${project.id}`}
                  className={`block cursor-pointer ${projectId === project.id ? "bg-gray-200 font-semibold" : ""} py-3 pl-6 pr-3 text-sm hover:bg-kanban-grey2`}
                >
                  {project.name}
                </Link>
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
      <main className="grid-in-main mr-3">
        {children}
        <Toaster />
      </main>
    </div>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();
  return (
    <div>
      {sessionData ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="cursor-pointer">
              {sessionData?.user?.image && (
                <AvatarImage src={sessionData?.user?.image} />
              )}
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {sessionData && (
              <>
                <DropdownMenuLabel>
                  {`Logged in as ${sessionData.user?.name}`}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={sessionData ? () => void signOut() : () => void signIn()}
            >
              {sessionData ? "Sign Out" : "Sign In"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={() => void signIn()}>Sign In</Button>
      )}
    </div>
  );
}
