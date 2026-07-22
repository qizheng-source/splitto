import { CreateGroupForm } from "@/components/CreateGroupForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-20 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Splitto</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Start a group, share the link, and split expenses together. No account needed.
          </p>
        </div>
        <CreateGroupForm />
      </div>
    </div>
  );
}
