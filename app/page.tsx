export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        BTECH Field Mapping
      </h1>

      <p className="mt-4">
        Geological Mapping Database System
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-bold">Projects</h2>
          <p>0</p>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-bold">Points</h2>
          <p>0</p>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-bold">Samples</h2>
          <p>0</p>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-bold">Comments</h2>
          <p>0</p>
        </div>
      </div>
    </div>
  );
}