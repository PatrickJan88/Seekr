import React, { useState } from 'react';
import { toast } from 'sonner';

export function SupportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xdeneyyy", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        toast.success("Success! Your message has been sent.");
        form.reset();
      } else {
        const responseData = await response.json().catch(() => null);
        toast.error("Error: " + (responseData?.errors?.[0]?.message || responseData?.message || "Something went wrong"));
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="support-form"
      onSubmit={handleSubmit}
      className="bg-white border border-[#efefef] rounded-2xl shadow-2xs overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        <h3 className="text-[15px] font-bold text-[#121722] mb-1">Customer Support</h3>
        <p className="text-[13px] text-[#777c86] leading-relaxed mb-3">
          Send us your suggestions or report any bugs you encounter.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-[#777c86] mb-1">Your Name</label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="w-full h-[38px] px-3.5 rounded-lg border border-[#efefef] bg-[#faf9f7] text-[13px] text-[#121722] placeholder:text-[#a5a5a5] focus:outline-none focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] transition-all"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#777c86] mb-1">Your Email</label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full h-[38px] px-3.5 rounded-lg border border-[#efefef] bg-[#faf9f7] text-[13px] text-[#121722] placeholder:text-[#a5a5a5] focus:outline-none focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-xs font-medium text-[#777c86] mb-1">Message</label>
            <textarea
              name="message"
              id="message"
              required
              rows={3}
              className="w-full px-3.5 py-2 rounded-lg border border-[#efefef] bg-[#faf9f7] text-[13px] text-[#121722] placeholder:text-[#a5a5a5] focus:outline-none focus:border-[#0068f9] focus:ring-1 focus:ring-[#0068f9] transition-all resize-y"
              placeholder="How can we help?"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#faf9f7] border-t border-[#efefef] flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all bg-[#0068f9] hover:bg-[#024bb1] text-white shadow-2xs h-[38px] px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
