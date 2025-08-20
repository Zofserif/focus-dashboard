import { FocusModule } from "~/components/focus-module"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="w-full h-full flex flex-col">
        <h1 className="text-3xl font-bold text-center mb-8">Focus Dashboard</h1>
        <FocusModule />
      </div>
    </main>
  )
}
