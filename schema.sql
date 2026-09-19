-- Supabase Schema for Product Price Tracker

-- Drop old tables if they exist
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.scrape_logs CASCADE;
DROP TABLE IF EXISTS public.tracked_products CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: products
CREATE TABLE public.products (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    brand TEXT,
    category TEXT,
    image_url TEXT,
    latest_price TEXT,
    in_stock BOOLEAN,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Table: price_history
CREATE TABLE public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price TEXT,
    in_stock BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Table: scrape_logs
CREATE TABLE public.scrape_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
