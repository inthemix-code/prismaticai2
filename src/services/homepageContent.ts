import { supabase } from '../lib/supabase';

export interface Testimonial {
  id: string;
  author_name: string;
  author_title: string;
  author_avatar_url: string;
  quote: string;
  rating: number;
  display_order: number;
}

export interface FeaturedPrompt {
  id: string;
  prompt: string;
  category: string;
  display_order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, author_name, author_title, author_avatar_url, quote, rating, display_order')
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.warn('Failed to load testimonials:', error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchFeaturedPrompts(): Promise<FeaturedPrompt[]> {
  const { data, error } = await supabase
    .from('featured_prompts')
    .select('id, prompt, category, display_order')
    .eq('is_featured', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.warn('Failed to load featured prompts:', error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('id, question, answer, display_order')
    .eq('is_published', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.warn('Failed to load faqs:', error.message);
    return [];
  }
  return data ?? [];
}

export async function subscribeToNewsletter(email: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: trimmed });
  if (error) {
    if (error.code === '23505') {
      return { ok: true };
    }
    return { ok: false, error: 'Unable to subscribe right now. Please try again.' };
  }
  return { ok: true };
}
