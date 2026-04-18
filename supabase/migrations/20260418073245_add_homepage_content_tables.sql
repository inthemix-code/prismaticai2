/*
  # Homepage Content Tables

  1. New Tables
    - `testimonials` - Public testimonials shown on homepage
      - `id` (uuid, pk)
      - `author_name` (text)
      - `author_title` (text)
      - `author_avatar_url` (text)
      - `quote` (text)
      - `rating` (int, 1-5)
      - `display_order` (int)
      - `is_published` (bool)
      - `created_at` (timestamptz)
    - `featured_prompts` - Curated example prompts
      - `id` (uuid, pk)
      - `prompt` (text)
      - `category` (text)
      - `display_order` (int)
      - `is_featured` (bool)
      - `created_at` (timestamptz)
    - `faqs` - Frequently asked questions
      - `id` (uuid, pk)
      - `question` (text)
      - `answer` (text)
      - `display_order` (int)
      - `is_published` (bool)
      - `created_at` (timestamptz)
    - `newsletter_subscribers` - Email signups
      - `id` (uuid, pk)
      - `email` (text unique)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access (SELECT) for published/featured content
    - Anonymous insert allowed for newsletter signup only
    - No update/delete policies for public users

  3. Seed Data
    - Initial testimonials, featured prompts, and FAQs for launch
*/

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL DEFAULT '',
  author_title text NOT NULL DEFAULT '',
  author_avatar_url text NOT NULL DEFAULT '',
  quote text NOT NULL DEFAULT '',
  rating int NOT NULL DEFAULT 5,
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published testimonials"
  ON testimonials FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS featured_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  display_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE featured_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view featured prompts"
  ON featured_prompts FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published faqs"
  ON faqs FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Seed testimonials
INSERT INTO testimonials (author_name, author_title, author_avatar_url, quote, rating, display_order) VALUES
  ('Priya Ramachandran', 'Senior ML Engineer, Fintech', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200', 'Prismatic saved me from bouncing between four tabs. The fusion response catches nuances that any single model misses.', 5, 1),
  ('Marcus Chen', 'Product Lead, SaaS Startup', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200', 'The side-by-side comparison is a revelation. I can finally trust one answer instead of second-guessing three.', 5, 2),
  ('Elena Vasquez', 'Research Scientist', 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200', 'As a researcher, the analytics layer is incredible. Sentiment, keywords, confidence—all the signals I need in one place.', 5, 3);

-- Seed featured prompts
INSERT INTO featured_prompts (prompt, category, display_order) VALUES
  ('Explain transformer architecture like I''m a software engineer', 'Learning', 1),
  ('Compare Rust vs Go for building a high-throughput API', 'Engineering', 2),
  ('What are the biggest risks in adopting generative AI in healthcare?', 'Research', 3),
  ('Draft a concise product launch announcement for a dev tool', 'Writing', 4),
  ('How does CRISPR gene editing actually work?', 'Science', 5),
  ('Walk me through system design for a real-time chat app', 'Engineering', 6);

-- Seed FAQs
INSERT INTO faqs (question, answer, display_order) VALUES
  ('How does Prismatic work?', 'You ask one question. Prismatic sends it in parallel to Claude, Grok, and Gemini, then synthesizes the best parts of each into a single unified answer—while still letting you inspect every source response.', 1),
  ('Which AI models do you support?', 'Today we support Anthropic Claude, xAI Grok, and Google Gemini. We continuously evaluate new frontier models and add them as they mature.', 2),
  ('Is my data private?', 'Your queries are sent directly to each provider for inference. We store conversation history in your account for your own reference, and never train on your data.', 3),
  ('Do you offer an API?', 'An API is on the roadmap. Join the newsletter to be the first to hear when it launches.', 4),
  ('How accurate is the fusion response?', 'The fusion layer is designed to combine the strongest points from each model while flagging disagreement. You can always review individual model responses to verify.', 5);
