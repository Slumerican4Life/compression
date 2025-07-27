import Header from '@/components/Header';
import ImageUpload from '@/components/ImageUpload';
import FeedbackSection from '@/components/FeedbackSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12">
        <ImageUpload />
      </main>
      <FeedbackSection />
    </div>
  );
};

export default Index;
