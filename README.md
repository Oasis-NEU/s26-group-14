HowlMuch
A dining dollar budget tracker built for Northeastern University students. Track your spending, visualize your balance over time, and get AI-powered dining recommendations based on your current budget.
Live at: howlmuch.vercel.app

Features

Spending log — add entries with a date, amount, and label
Live stats — real-time balance, total spent, days left, and under/over budget verdict
Chart — balance over time with ideal rate, trend line, projections, and hover tooltips
Dining suggestions — AI recommendations from verified NU dining dollar locations, powered by Groq and Meta's Llama 3.1
Semester management — archive and restore past semesters
Auth — email/password login with data synced across devices


Stack

Frontend — React + Vite
Database + Auth — Supabase (Postgres + Row Level Security)
Hosting — Vercel
AI — Groq API running Meta's Llama 3.1 8B
