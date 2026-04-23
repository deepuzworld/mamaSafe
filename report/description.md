# MamaSafe Project Description

MamaSafe is a comprehensive, multi-tiered digital tele-health platform designed to revolutionize maternal healthcare by bridging the gap between physical tracking and psychological well-being. Built specifically to support expectant and postpartum mothers, the platform integrates advanced AI with familial connectivity to create a proactive safety net.

## Core Objectives
* **Holistic Monitoring:** Real-time tracking of physiological and emotional metrics.
* **AI-Driven Mental Health Support:** Uses facial emotion recognition (Affective Computing) to detect early signs of distress or postpartum depression.
* **Systemic Familial Connectivity:** A dedicated "Partner Bridge" that syncs a mother's health insights with her partner to foster a supportive caregiving environment.
* **Expert Access:** Seamless tele-health scheduling with certified medical professionals.
* **Community Support:** A moderated ecosystem called "Sister Stories" for mothers to share experiences securely.

## Key Features
* **Health Insights Dashboard:** Displays AI-processed mood trends and physiological data using beautiful, calming glassmorphic designs.
* **Partner Bridge:** Allows partners to view real-time alerts and health status, ensuring they stay engaged in the care lifecycle.
* **Expert Portal:** Enables medical professionals to manage appointments, review patient history, and publish verified educational resources.
* **Sister Stories:** A community forum for peer-to-peer support, moderated by administrators to ensure a safe environment.
* **Emergency Alert System:** Automatically notifies partners and medical experts if persistent clinical distress is detected by the AI.

## Technology Stack
* **Frontend:** Next.js (App Router) with Tailwind CSS for a premium, responsive UI.
* **Backend:** Node.js & Express API Gateway for orchestration.
* **AI Microservice:** Python-based service utilizing DeepFace and OpenCV for real-time facial emotion recognition.
* **Database:** PostgreSQL with Prisma ORM for secure, type-safe data management.
* **Infrastructure:** Docker containerization ensures consistent environments across the microservices.

## User Roles
1. **Mothers:** The primary users who track vitals, log moods via the AI webcam interface, and access care resources.
2. **Partners:** Connected users who receive synced insights and alerts to better support their spouses.
3. **Medical Experts:** Healthcare providers who manage consultations and contribute educational vlogs and blogs.
4. **Admins:** System overseers who manage user onboarding, verify experts, and moderate community content.


The short answer is: No, it will not be visible or functional yet.

GitHub Pages is designed for "Static Sites" (simple HTML/CSS/JS). Because MamaSafe is a complex Full-Stack Application, it cannot run directly on GitHub Pages for several reasons:

Monorepo Structure: Your code is organized into frontend, backend, and ai_service. GitHub Pages expects a single index.html at the very root of the repository, which isn't there.
Next.js Requirements: The frontend needs a "Build" step (next build) to generate the pages.
Missing Backend: Even if the frontend appeared, features like Login, Registration, and Face Verification would fail because they require your Node.js Server and Python AI Service to be running 24/7 on a platform that supports "Compute" (like Vercel, Heroku, or Render).
How to make it visible online (Recommended Step):
If you want to show your project to others, the best approach is:

Frontend: Deploy the frontend folder to Vercel. It is free and specifically designed for Next.js.
Backend: Deploy the backend and ai_service to a platform like Render.com or Railway.app, which supports Node.js and Databases.
What you can do right now:
I've already updated the README and project structure so that if you run it locally, it works perfectly. For your Academic Report, I recommend taking screenshots or a video of it running on your local machine, as that proves the full-stack logic (including the AI) is operational!

Would you like me to help you create a specific "Deployment Guide" for your report?