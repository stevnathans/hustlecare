// app/admin/page.tsx
export default function AdminDashboardPage() {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Overview</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">Users: 120</div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">Products: 87</div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">Comments: 250</div>
        </div>
      </div>
    )
  }
  