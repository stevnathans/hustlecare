// components/BusinessCard.tsx
import Image from "next/image";

type Business = {
  id: string;
  name: string;
  imageUrl: string;
};

export default function BusinessCard({ business }: { business: Business }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all">
      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3">
        <Image
          src={business.imageUrl}
          alt={business.name}
          fill
          className="object-cover"
        />
      </div>
      <h2 className="text-lg font-semibold text-center">{business.name}</h2>
    </div>
  );
}
