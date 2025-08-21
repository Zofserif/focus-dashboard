import { FocusModule } from "~/components/focus-module"

export default function Home() {
  return (
    <main className="h-screen bg-background p-2 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-4">Focus Dashboard</h1>
        <div className="flex-1 overflow-hidden">
          <FocusModule />
        </div>
      </div>
    </main>
  )
}
