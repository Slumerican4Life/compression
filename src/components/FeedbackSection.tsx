import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  email?: string;
}

const FeedbackSection = () => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [existingFeedback, setExistingFeedback] = useState<FeedbackItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('id, rating, comment, created_at, email')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching feedback:', error);
    } else {
      setExistingFeedback(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || rating === 0) {
      toast({
        title: "Please provide both rating and feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: user?.id,
        email: user?.email,
        rating,
        comment: feedback.trim()
      });

    if (error) {
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank you for your feedback!",
        description: "Your review helps us improve the service.",
      });
      
      setFeedback('');
      setRating(0);
      fetchFeedback(); // Refresh feedback list
    }

    setIsSubmitting(false);
  };

  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How did we do?</CardTitle>
            <CardDescription>
              Share your experience with our image compression tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <span className="text-sm font-medium">Rate your experience:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="feedback" className="text-sm font-medium">
                  Tell us about your experience:
                </label>
                <Textarea
                  id="feedback"
                  placeholder="How was the compression quality? Was it easy to use? Any suggestions for improvement?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Display existing feedback */}
        {existingFeedback.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl">What others are saying</CardTitle>
              <CardDescription>
                Recent reviews from our users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingFeedback.map((item) => (
                <div key={item.id} className="border-b border-border pb-4 last:border-b-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= item.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{item.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default FeedbackSection;