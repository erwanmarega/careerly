export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
        <span className="font-black text-lg tracking-tight">Careerly</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  )
}
