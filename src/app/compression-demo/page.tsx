import CompressionDemo from '@/components/CompressionDemo';

export const metadata = {
  title: '🔥 Compression Pipeline Demo - Droply',
  description: 'Experience the god-tier compression pipeline in action with client-side compression, backend awareness, and flexible decompression options.',
};

export default function CompressionDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CompressionDemo />
    </div>
  );
}
