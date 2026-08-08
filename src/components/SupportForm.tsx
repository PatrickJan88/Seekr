import React, { useState } from 'react';
import { toast } from 'sonner';

export function SupportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    
    // Use JSON for Web3Forms submission to ensure proper delivery
    const data = {
      access_key: "6b48a208-1fca-4e42-ab22-3f11e5c3f398",
      name: form.sender_name.value,
      email: form.email.value,
      message: form.message.value,
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        toast.success("Success! Your message has been sent.");
        form.reset();
      } else {
        toast.error("Error: " + (responseData.message || "Something went wrong"));
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Customer Support</h3>
        <p className="text-sm text-slate-500 mb-4">
          Send us your suggestions or report any bugs you encounter.
        </p>
        <form id="support-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sender_name" className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <input 
              type="text" 
              name="sender_name" 
              id="sender_name" 
              required
              className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Your Email</label>
            <input 
              type="email" 
              name="email" 
              id="email" 
              required
              className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea 
              name="message" 
              id="message" 
              required
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How can we help?"
            ></textarea>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
