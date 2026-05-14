import { createClient } from "@supabase/supabase-js";

const supabaseUrl ="https://dyrksawkjpuyizwqalhh.supabase.co";
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cmtzYXdranB1eWl6d3FhbGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMDc5OTAsImV4cCI6MjA5Mzc4Mzk5MH0.az3RUwZ6_pQLES9uD-AHoE8XlIQfTNQ59rykAprEylA";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);