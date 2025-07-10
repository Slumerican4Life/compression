import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about ImageCompress Pro
            </p>
          </div>

          {/* Facts Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>✨ Key Features & Facts</CardTitle>
              <CardDescription>What makes ImageCompress Pro special</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">🚀 Fast</Badge>
                  <span className="text-sm">Batch processing up to 50 images</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">🎯 Quality</Badge>
                  <span className="text-sm">Advanced algorithms preserve image quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">📱 Formats</Badge>
                  <span className="text-sm">JPEG, PNG, WebP support</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">🔒 Privacy</Badge>
                  <span className="text-sm">Client-side processing, data never leaves your device</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">⚡ Premium</Badge>
                  <span className="text-sm">Advanced features for $9.99/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">🎨 Dark Mode</Badge>
                  <span className="text-sm">Beautiful interface, easy on the eyes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>❓ Common Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How does image compression work?</AccordionTrigger>
                  <AccordionContent>
                    Our advanced compression algorithms analyze your images and reduce file size while maintaining visual quality. 
                    We use smart techniques like removing metadata, optimizing color palettes, and applying efficient encoding 
                    to achieve the best compression ratios without noticeable quality loss.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Is my data safe and private?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely! All image processing happens directly in your browser using client-side technology. 
                    Your images never leave your device and are not uploaded to our servers. This ensures complete 
                    privacy and security of your files.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>What formats are supported?</AccordionTrigger>
                  <AccordionContent>
                    We support the most popular image formats including JPEG, PNG, and WebP. Our system automatically 
                    detects the format and applies the most appropriate compression settings for optimal results.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>What's included in the Premium subscription?</AccordionTrigger>
                  <AccordionContent>
                    Premium subscribers get access to advanced compression algorithms, batch processing of up to 50 images, 
                    priority processing, additional format support, and exclusive features like lossless compression modes. 
                    Premium is $9.99/month and can be cancelled anytime.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I process multiple images at once?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Our batch processing feature allows you to compress multiple images simultaneously. 
                    Free users can process up to 5 images at once, while Premium subscribers can handle up to 50 images 
                    in a single batch with advanced queue management.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>How much can I reduce file sizes?</AccordionTrigger>
                  <AccordionContent>
                    Compression results vary depending on the original image, but typically you can expect 60-80% file size 
                    reduction while maintaining excellent visual quality. Our side-by-side comparison tool lets you preview 
                    the results before downloading.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Do I need to install anything?</AccordionTrigger>
                  <AccordionContent>
                    No installation required! ImageCompress Pro works entirely in your web browser. Simply visit our website, 
                    upload your images, and start compressing. It works on desktop, tablet, and mobile devices.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>Can I cancel my subscription anytime?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can cancel your Premium subscription at any time through your account settings. There are no 
                    long-term commitments or cancellation fees. You'll continue to have access to Premium features until 
                    the end of your current billing period.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger>What happens to my images after compression?</AccordionTrigger>
                  <AccordionContent>
                    Since all processing happens in your browser, compressed images are stored temporarily in your device's 
                    memory until you download them. Once you close the browser tab or navigate away, all image data is 
                    automatically cleared for your privacy and security.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger>How do I get support if I have issues?</AccordionTrigger>
                  <AccordionContent>
                    We're here to help! Premium subscribers get priority email support, while free users can reach out 
                    through our contact form. We typically respond within 24 hours and are committed to resolving any 
                    issues you might encounter.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQ;