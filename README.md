# 23 · Clinic Registration & Billing

**Roadmap stage:** Phase 7 → 8 – Backend to Full-Stack · December 2025–February 2026

**Inspired by:** a patient registration and billing system I worked on for a walk-in outpatient clinic

My first project with a real frontend *and* a real backend talking to each other. It covers only the front desk side of a small clinic: who the patient is, what services they're paying for, how much it costs after discounts, whether they've paid, and the receipt they walk out with. It is not a medical records system. There are no diagnoses or prescriptions here, on purpose.

### Features
- Staff login with **JWT** and **bcrypt**-hashed passwords
- Three roles: **front desk** registers patients and adds charges, **cashier** takes payments and sees the sales report, **admin** can do everything (including managing the service catalog through the API)
