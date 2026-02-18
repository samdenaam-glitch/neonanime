# NEON ANIME – Legal Streaming Site (Production Ready)

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge/deploy-status)](https://app.netlify.com)

A futuristic anime website powered by Supabase + Netlify. All content is legal (public domain, CC, or original).

## Features

- Fully responsive, cyberpunk UI
- Dynamic content from Supabase
- Search, trending, carousel, public domain section
- Error handling and loading states
- Accessible keyboard navigation

## Setup Instructions

### 1. Supabase Setup

- Create a project at [supabase.com](https://supabase.com)
- Run this SQL to create the table:

```sql
CREATE TABLE anime (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  episodes INT,
  rating INT,
  genre TEXT,
  badge TEXT,
  type TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON anime FOR SELECT USING (true);