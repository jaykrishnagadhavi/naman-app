# ABrainoConscious Self-Hosted Video Stack

This service powers the private, encrypted, anti-piracy video streaming infrastructure for ABrainoConscious courses, as specified in **Section 11** of `docs/SPEC.md`.

---

## 1. Architectural Overview

- **Host Domain:** `video.${ROOT_DOMAIN}` (e.g. `video.abrainoconcious.com`)
- **Technology Stack:**
  - **Caddy:** Reverse proxy with automatic Let's Encrypt SSL/TLS certificates and strict CORS origin verification.
  - **tusd:** Resumable chunked file upload server handling large raw video files (MP4, MOV, MKV, WebM up to 10 GB) with pause/resume support.
  - **video-api (Node.js / Fastify):** Authenticated backend managing upload tokens, heartbeat leases, playback sessions, key exchange, and watermark forensics.
  - **BullMQ + Redis:** Job queue orchestrating multi-resolution adaptive bitrate video transcoding tasks.
  - **FFmpeg Workers:** Transcodes raw uploads into segmented HLS (360p, 480p, 720p, 1080p), AAC audio, 6-second segment sizes, encrypted with AES-128 per-video keys.

---

## 2. Anti-Piracy Architecture (10 Defense Layers)

1. **Server-Side Access Checks:** `get-playback` Edge Function checks user authentication and active unexpired enrollment before returning a short-lived signed playback token (~10 mins).
2. **Encrypted HLS + Authenticated Key Delivery:** Segments and AES-128 decryption keys are served exclusively through token-verified endpoints; raw file paths return 401/403.
3. **Anti-Scraping Segment Rate Limiting:** Sessions fetching segments faster than 3-4x real-time or skipping far ahead are cut off and flagged.
4. **Dynamic Forensic Watermark:** Moving semi-transparent overlay displaying the student's name, masked email/phone, and unique watermark session ID. Periodic checks pause playback if the watermark element is tampered with or hidden.
5. **Device & Stream Concurrency Caps:** Maximum 2 devices registered per student account; strictly 1 active concurrent playback stream.
6. **Account Sharing Anomaly Detection:** Automated alerts for IP/city jumping within 24 hours.
7. **Strict Origin & Referer Locking:** Only requests from `app.${ROOT_DOMAIN}` with valid CORS headers are served.
8. **Video Access Logging:** Detailed segment-level access logs recorded in `video_access_logs`.
9. **Admin Piracy & Watermark Trace:** Dedicated admin interface to look up leak source accounts by visual watermark ID.
10. **Terms & Legal Safeguards:** Clear copyright acceptance at checkout forbidding unauthorized capture and redistribution.

---

## 3. VPS Specifications & Sizing

- **Target Node:** Ubuntu 24.04 LTS (India / Singapore region)
- **Minimum Compute:** 4 vCPU, 8 GB RAM, 200 GB+ NVMe SSD, 4 TB+ monthly bandwidth.
- **Projected Storage:** ~12 hours of launch content across 360p/480p/720p renditions requires ~25 GB (plus ~50 GB originals buffer).
- **Projected Bandwidth:** 100 students completing a 12-hour 720p course consume ~1.3 TB monthly transfer.

---

## 4. Implementation Phase

*Implementation will take place in Step 10 & 11 as scheduled in `docs/SPEC.md`.*

