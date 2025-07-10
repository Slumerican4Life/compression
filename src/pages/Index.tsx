import Header from '@/components/Header';
import ImageUpload from '@/components/ImageUpload';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <ImageUpload />
      </main>
    </div>
  );
};

export default Index;
