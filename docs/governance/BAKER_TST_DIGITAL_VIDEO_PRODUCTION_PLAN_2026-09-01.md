# Baker Talking Smart Target — Digital Video Production Plan

Date: **2026-09-01**

Result: **PLAN READY — MASTER NOT RENDERED**

## Decision

Do not deliver an ordinary browser screen recording as the YouTube master.

The approved product already contains the complete visual scenes, deterministic choreography settings, 22 clean narration WAV files, the registered Baker authority image, exact simulated observations/results, actual SEC/Equipment Profile/Vault surfaces, and a reusable PLAYER. A materially cleaner master should be generated from those assets and the same logical timeline.

Producing that master in the current environment is not bounded tonight. There is no installed video compositor/muxer (`ffmpeg`, `ffprobe`, PyAV, MoviePy, or imageio-ffmpeg), and macOS `screencapture` can record the display but only advertises default-input audio—not lossless capture of the existing narration assets. Building a custom frame encoder/audio compositor would be a new rendering subsystem. The Founder instruction explicitly says to stop at a concrete plan in that case.

## Existing approved source package

- Product source: `docs/shoot.html`
- PLAYER: `docs/self_teaching_player.js`
- Demo fixture/session: `docs/baker_talking_demo_session.js`
- Registered target image: `docs/assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png`
- Narration: `docs/assets/audio/episode59/*.wav`
- SEC/Vault surface: `docs/records.html`
- Equipment Profile surface: `docs/matrix.html`
- Approved choreography source: `SMART_TARGET_TALK_CHOREOGRAPHY` and `bakerSampleDemoSteps()` in `docs/shoot.html`

The 22 narration assets total **90.838232 seconds**. Fixed authored holds, iframe-settle allowances, and four demonstrated action taps produce a nominal logical run of approximately **134.168 seconds (2:14.168)** before any variable iframe load latency. A digital export must eliminate that variable latency by preloading the component surfaces.

## Highest-quality bounded production route

Create a separate export harness that imports or extracts the approved TST scene functions and data but never changes the live product path.

1. Pin the export to the exact approved source commit.
2. Serve a clean local restore of that commit.
3. Add an export-only wrapper outside the live product that:
   - preloads target, SEC, Equipment Profile, Vault, fonts, and all WAV files;
   - renders at a fixed **1920×1080** viewport;
   - hides browser chrome, pointer, selection, focus rings caused only by automation, and the interactive PLAYER controls if the desired video is the lesson rather than a PLAYER tutorial;
   - advances the existing logical scenes using an export clock derived from the approved narration durations and choreography constants;
   - captures deterministic frames at 30 fps or 60 fps.
4. Encode the frame stream to an intermediate visually lossless or high-bitrate master.
5. Assemble the 22 original WAV files at their exact timeline offsets; do not re-record speaker output from a microphone.
6. Mux video and narration into:
   - archival master: ProRes 422 + PCM audio (`.mov`), 1920×1080;
   - YouTube delivery: H.264 High Profile + AAC 48 kHz (`.mp4`), 1920×1080, 15–25 Mbps;
   - optional silent trade-show loop only if Founder wants it; otherwise retain the narrated master and loop at the clean SAMPLE boundary.
7. End on the identical clean SAMPLE waiting frame used at the beginning, with sufficient tail hold for a seamless booth loop.

## Why 1080p is the honest master

The registered Baker source image is **1102×1713**. A 4K canvas is technically possible, but it cannot create target detail that the source image does not contain. A pristine 1920×1080 master preserves the source honestly and is the recommended production deliverable. A 4K upscale may be generated later for platform bitrate treatment, but it must be labeled as an upscale—not a native 4K source.

## Required tooling

One approved media toolchain is still required:

- preferred: pinned `ffmpeg`/`ffprobe` binaries plus Playwright/Chromium frame capture;
- acceptable macOS-native alternative: a reviewed AVFoundation export utility that accepts deterministic frames and the original WAV timeline;
- not acceptable for the master: screen recording with microphone/system-loopback audio.

The current machine has `avconvert`, `afconvert`, `afinfo`, and video-capable `screencapture`, but `avconvert` is a transcoder rather than the missing frame/audio compositor.

## Editorial decision list

The export must follow the current `bakerSampleDemoSteps()` order exactly:

**Target selected → Add Photo teaching → Aim → marked shots → Show Results → group center → vector → adjustment → Begin Confirmation → confirmation → Show Results → Save → SEC → Equipment Profile → Ballistic Vault → completion/replenishment → clean SAMPLE**

Narration asset durations and stage ownership are preserved in `BAKER_TST_DIGITAL_VIDEO_ASSET_MANIFEST.csv` beside this report.

## Validation gate

Before delivery, verify the rendered file from beginning to end:

- exact approved scene order and words;
- no missing, duplicated, clipped, or stale scene;
- narration begins and ends on the intended visual state;
- observation cadence, group-center reveal, vector draw, correction, and confirmation remain synchronized;
- actual SEC, Equipment Profile, and Vault are readable;
- no browser chrome, mouse pointer, debug UI, scrollbars, recording notifications, or focus artifacts;
- audio is clean, full-duration, and free of TTS fallback;
- first and last SAMPLE frames match for looping;
- container reports 1920×1080, expected frame rate, H.264 video, AAC audio, and approximately 2:14 duration;
- full visual watch and full audible listen both PASS.

## What remains

1. Founder approves a pinned media toolchain or provides an existing approved encoder.
2. Implement the export-only harness; do not alter live TST.
3. Generate archival and YouTube masters.
4. Watch/listen to both end to end.
5. Preserve master, source commit, EDL, checksums, and reproduction instructions as a new Keepsake only after PASS.

This is the shortest route to a faithful digital TST. It reuses the child we built; it does not teach a second child to imitate him from a screen recording.
