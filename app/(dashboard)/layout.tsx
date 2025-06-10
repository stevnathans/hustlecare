export default function ProfileLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-full bg-gray-50">
        {children}
      </div>
    );
  }