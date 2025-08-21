import { FocusModule } from "~/components/focus-module";

export default function Home() {
  return (
    <main className="bg-background h-screen overflow-hidden p-2">
      <div className="flex h-full w-full flex-col">
        <h1 className="mb-4 text-center text-2xl font-bold">STAY FOCUSED</h1>
        <div className="flex-1 overflow-hidden">
          <FocusModule />
        </div>
      </div>
    </main>
  );
}
