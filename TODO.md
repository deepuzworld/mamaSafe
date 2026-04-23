# MamaSafe Project Checklist (Pending Tasks)

## 📄 Academic Report Finalization
- [x] **Capture & Insert Screenshots**:
    - [x] Mother Dashboard (Health Insights)
    - [x] Partner Link/Sync Window
    - [x] Expert Onboarding/Dashboard
    - [x] Admin Content Moderation Portal
    - [x] Mobile/Responsive View and AI Emotion Tally
- [x] **Populate Results & Discussion**:
    - [x] Add latency metrics for Kannel SMS delivery (Simulation logs).
    - [x] Document AI Emotion tracking accuracy results.
    - [x] Add screenshots of successful test cases for "Activate Pulse".
- [x] **Technical Documentation**:
    - [x] Verify DFD Level 1 diagrams in `report/dfd.md`.
    - [x] Finalize Database Schema mapping in the main report.

## 🚨 Emergency Pulse System (Self-Hosted Stack)
- [x] **Docker Service Check**:
    - [x] Run `docker-compose up -d` and verify Kannel/FreeSWITCH health.
    - [x] Test ESL connection between Backend and FreeSWITCH.
- [x] **End-to-End Pulse Test**:
    - [x] Trigger Red Button from Mother Dashboard (Verified via Twilio & Simulation script).
    - [x] Verify SMS appears (Confirmed via Twilio SID).
    - [x] Verify Voice Call command is logged (Confirmed via Twilio SID).
- [x] **Partner Notification**: 
    - [x] Ensure `phoneNumber` field is mandatory for Partner profiles to enable Pulse alerts.

## 🎨 UI/UX Refinement
- [x] **Consistency Pass**: 
    - [x] Apply glassmorphic theme to Expert and Admin dashboards to match Mother Dashboard.
- [x] **Session Stability**:
    - [x] Verify Role-based redirection on hard refresh (Mother vs Partner/Expert).
- [x] **Empty States**:
    - [x] Add modern "No data" placeholders for new mothers (Mood/Sleep logs).

## ⚙️ Backend & Infrastructure
- [x] **PostgreSQL Sync**:
    - [x] Migrate `dev.db` (SQLite) to PostgreSQL instance.
    - [x] Update `prisma/schema.prisma` and run `npx prisma db push`.
- [x] **Expert Booking Logic**:
    - [x] Finalize strict 9-slot daily capacity check to prevent double-bookings.
- [x] **Environment Audit**:
    - [x] Ensure all `.env.example` files are updated with current simulation credentials.

## 🧪 Testing
- [x] **Face Verification**:
    - [x] Test the FaceIO integration or DeepFace liveness check on different devices.
- [x] **Security**:
    - [x] Verify Partner OTP login redirects strictly to Password Reset on first use.
