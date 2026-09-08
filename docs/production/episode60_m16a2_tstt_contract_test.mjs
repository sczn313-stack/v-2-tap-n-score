import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, css, source, narration, viewportGuard, narrationStandard, matrix, shoot, records, player, demoFixture, m4Runtime, zeroingPlatform, zeroingProfiles, workspace, workspaceCss, registrationAuthority, sessionAuthority, buildSite, buildNetlify, reviewServer] = await Promise.all([
  readFile("m16a2-tstt.html", "utf8"),
  readFile("m16a2-tstt.css", "utf8"),
  readFile("m16a2-tstt.js", "utf8"),
  readFile("tstt_narration.js", "utf8"),
  readFile("tstt_viewport_guard.js", "utf8"),
  readFile("architecture/TSTT_NARRATION_STANDARD.md", "utf8"),
  readFile("matrix.html", "utf8"),
  readFile("shoot.html", "utf8"),
  readFile("records.html", "utf8"),
  readFile("self_teaching_player.js", "utf8"),
  readFile("m16a2_talking_demo_session.js", "utf8"),
  readFile("m4_runtime.js", "utf8"),
  readFile("zeroing_platform.js", "utf8"),
  readFile("zeroing_target_profiles.js", "utf8"),
  readFile("smart_target_workspace.js", "utf8"),
  readFile("smart_target_workspace.css", "utf8"),
  readFile("backend/target_image_registration_authority.py", "utf8"),
  readFile("backend/session_authority.py", "utf8"),
  readFile("production/build-site.mjs", "utf8"),
  readFile("production/build-netlify.mjs", "utf8"),
  readFile("production/m16a2_tstt_review_server.mjs", "utf8")
]);
const chapterThreeSource = source.slice(source.indexOf('id: "a2-3"'), source.indexOf('id: "a2-4"'));
const chapterFourStart = source.indexOf('id: "a2-4"');
const chapterFourSource = source.slice(chapterFourStart, source.indexOf("\n  ]);\n\n  const elements", chapterFourStart));
const chapterThreeDemoSource = shoot.slice(shoot.indexOf('if (fixture.demoKind === "m16a2-tstt") return ['), shoot.indexOf("const aimPostSpeechHold"));

assert.match(html, /Baker M16A2 25 Meter TSTT/, "the route identifies the exact lesson product");
assert.match(html, /PAUSE[\s\S]*STOP[\s\S]*REPLAY[\s\S]*CHAPTERS[\s\S]*RESTART/, "Snapshot 22 controls plus distinct Stop are present");
assert.doesNotMatch(`${html}\n${source}`, /10\s*(?:SEC|SECOND)|rewind/i, "the TSTT does not restore the retired 10-second rewind");
assert.match(html, /25 METERS ZEROING TARGET[\s\S]*M16A2/, "the physical target identity is reproduced exactly");
assert.doesNotMatch(`${html}\n${source}`, /BAKER M16A2 • 25 METER|M16A2 FACE|APPLICABLE BRANCH|BRANCH NOT AUTHORIZED|Match the target, then confirm/, "registry and architecture language stays off the teaching surface");
assert.match(source, /SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID[\s\S]*SCZN3_SAVED_EQUIPMENT_PROFILES/, "TSTT reads the existing Equipment Library owner state");
assert.doesNotMatch(source, /localStorage\.(?:setItem|removeItem)\(/, "TSTT never creates or mutates equipment state");
assert.match(source, /focus[\s\S]*pageshow[\s\S]*storage/, "TSTT rereads active equipment when the shooter returns");
assert.match(`${html}\n${source}`, /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply\./, "Chapter 1 presents the Founder-approved concise training guidance");
assert.doesNotMatch(`${html}\n${source}`, /CURRENT EQUIPMENT|equipmentIndicator|equipmentStateLabel|equipmentLabel/, "Page 1 does not prominently display the shooter's stored equipment");
assert.doesNotMatch(source, /Learn the target and the M16A2 standard iron-sight setup this training will use\./, "Chapter 1 does not announce that teaching is coming");
assert.match(source, /AIM POINT[\s\S]*READ THE GRID[\s\S]*READ THE CLICKS[\s\S]*FIRE THE SHOT PATTERN[\s\S]*LET TAP-N-SCORE READ IT/, "Chapter 1 visibly teaches the complete target curriculum");
assert.match(source, /each square in the columns represents one front-sight up-or-down click[\s\S]*Each square in the rows represents three rear-windage clicks, right or left/i, "Chapter 1 reads the Founder-settled M16A2 square-to-control scales");
assert.doesNotMatch(`${source}\n${css}`, /target-marker|sample-group/, "Chapter 1 keeps the complete physical target free of intrusive teaching overlays");
assert.match(source, /Fire three to five shots before making an adjustment\.[\s\S]*THE CENTER OF YOUR SHOT PATTERN[\s\S]*better picture of where your shots are landing/, "Chapter 1 teaches the settled shooter-facing shot-pattern concept");
assert.match(html, /START SESSION/, "the Founder-approved session start remains available");
assert.doesNotMatch(`${html}\n${source}\n${css}`, /NEXT CHAPTER|NEXT — KNOW YOUR SIGHTS|NEXT — WATCH IT|next-chapter-overlay/, "continuous Chapters 1 through 3 expose no redundant forward controls");
assert.doesNotMatch(chapterFourSource, /nextChapterLabel/, "Chapter 4 retains its governed photo-entry and preservation destination instead of inventing another chapter");
assert.match(source, /label: "TARGET AND EQUIPMENT", shortTitle: "TARGET AND EQUIPMENT"[\s\S]*label: "KNOW YOUR SIGHTS", shortTitle: "KNOW YOUR SIGHTS"[\s\S]*label: "LET TAP-N-SCORE SHOW YOU", shortTitle: "LET TAP-N-SCORE SHOW YOU"[\s\S]*label: "YOU'RE UP!", shortTitle: "YOU'RE UP!"/, "TSTT exposes exactly the four Founder-approved chapter identities in order");
assert.equal([...source.matchAll(/id: "a2-\d+"/g)].length, 4, "the active TSTT registry contains exactly four chapters");
assert.doesNotMatch(source, /a2-5|PRE-FIRE READY|Ready for the first group/, "the stray Chapter 5 is removed");
assert.match(html, /tstt_narration\.js[\s\S]*m16a2-tstt\.js/, "the reusable narration standard loads before the product lesson");
assert.match(narration, /DEFAULT_SETTINGS = Object\.freeze\(\{ rate: 0\.70, pitch: 1, volume: 1 \}\)/, "the reusable narrator keeps the slower neutral baseline");
assert.ok(narration.indexOf("/^Samantha") < narration.indexOf("/^Reed"), "Samantha is selected before the neutral fallback voices");
assert.match(narration, /Samantha[\s\S]*Reed[\s\S]*Flo[\s\S]*Alex[\s\S]*Ava[\s\S]*Susan/, "neutral instructional fallbacks remain available");
assert.match(narration, /resolveSamantha[\s\S]*find\(voice => SAMANTHA_NAME\.test[\s\S]*if \(!voice\) return/, "production narration locks Samantha and refuses to speak through a fallback voice");
assert.match(narration, /SAMANTHA UNAVAILABLE[\s\S]*voiceschanged[\s\S]*resolveSamantha/, "the runtime waits for the device voice list and reports exact unavailability");
assert.doesNotMatch(`${html}\n${source}\n${css}`, /RUNTIME INSTRUCTOR|runtimeVoiceStatus|runtimeVoiceCheck|PLAY “SHOT PATTERN” CHECK|voice-diagnostic/, "the shooter-facing page contains no Samantha diagnostic or check residue");
assert.match(source, /chapterOneNarrationPlan[\s\S]*assets\/audio\/episode60\/chapter1\/[\s\S]*cue: index === 3 \? "columns" : \(index === 4 \? "rows"/, "Chapter 1 uses native Samantha audio segments with synchronized column and row cues");
assert.match(css, /grid-teaching-cue\.is-column[\s\S]*grid-teaching-cue\.is-row[\s\S]*animation: grid-teaching-pulse 1\.25s ease-in-out 2[\s\S]*prefers-reduced-motion[\s\S]*grid-teaching-cue\.is-active/, "Chapter 1 visibly pulses one representative column and row twice, including on the Founder reduced-motion runtime");
assert.match(narration, /NON_INSTRUCTIONAL_VOICES[\s\S]*Albert[\s\S]*Zarvox/, "novelty and theatrical system voices cannot become the instructor");
assert.match(narration, /pronounceForInstruction[\s\S]*M sixteen A two[\s\S]*minutes of angle[\s\S]*one point two five[\s\S]*zero point five/, "speech preparation deliberately pronounces equipment terminology and adjustment values");
assert.match(narration, /DEFAULT_PAUSES[\s\S]*normal: 450[\s\S]*action: 900[\s\S]*look: 1100/, "thought, action, and observation pauses are explicitly paced");
assert.match(narration, /deliveryRate[\s\S]*important[\s\S]*0\.66[\s\S]*action[\s\S]*0\.68/, "important facts and actions receive modest vocal emphasis without changing pitch");
assert.match(source, /Before making any sight adjustments, understand what this target is telling you\.[\s\S]*Always make the center crosshairs your aim point when zeroing your weapon\.[\s\S]*Each small square measures how far your shots are landing from the center crosshairs\.[\s\S]*columns represents one front-sight up-or-down click\.[\s\S]*rows represents three rear-windage clicks, right or left\.[\s\S]*Fire three to five shots before making an adjustment\.[\s\S]*The center of your shot pattern gives a better picture of where your shots are landing\.[\s\S]*Tap-n-Score can measure where it is in relation to the center crosshairs and tell you what adjustment to make\.[\s\S]*Next, we'll learn the sights\./, "Chapter 1 contains the complete settled Founder script in order");
assert.doesNotMatch(source.split('id: "a2-2"')[0], /\b(?:white|red|group|POIB)\b|center dot|center point|Do not chase/i, "Chapter 1 uses locked shooter-facing terminology without color, group, POIB, or the retired standalone explanation");
assert.match(source, /Controls elevation — moves your shot pattern up or down\.[\s\S]*Controls windage — moves your shot pattern right or left\.[\s\S]*For your 25-meter zero, set the drum to 8\/3, then turn it one click CLOCKWISE past 8\/3\.[\s\S]*After your zero is confirmed, turn it one click COUNTERCLOCKWISE back to 8\/3 for the 300-meter setting\.[\s\S]*Now you know which sight controls you'll adjust when Tap-n-Score tells you how to move your shot pattern\./, "Chapter 2 contains the complete concise Founder-approved knowledge in order");
assert.doesNotMatch(source.split('id: "a2-3"')[0], /For now, remember these three jobs|sight-recap|sight-intro|sight-job|drum-sequence|<figcaption>|\bFIND\b|\bJOB\b|exactly where each adjustment is on your rifle/, "Chapter 2 removes redundant find, job, summary, procedure, and recitation blocks");
assert.match(source, /chapterTwoNarrationSegments[\s\S]*chapterTwoNarrationPlan[\s\S]*assets\/audio\/episode60\/chapter2\//, "Chapter 2 keeps its locked words in native Samantha audio segments");
assert.match(source, /M16A2 · STANDARD IRON SIGHTS[\s\S]*FRONT SIGHT POST[\s\S]*REAR WINDAGE KNOB[\s\S]*REAR ELEVATION DRUM/, "Chapter 2 names each control once without find prompts");
assert.match(source, /FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE/, "Chapter 2 uses all three Founder-supplied real-hardware references");
assert.match(source, /front-sight-photo[\s\S]*photo-callout[\s\S]*rear-windage-photo[\s\S]*photo-callout[\s\S]*rear-drum-photo[\s\S]*8\/3 marking visible[\s\S]*photo-callout/, "Chapter 2 preserves restrained highlights on all three real-hardware photographs");
assert.match(source, /For your 25-meter zero[\s\S]*CLOCKWISE past 8\/3[\s\S]*After your zero is confirmed[\s\S]*COUNTERCLOCKWISE back to 8\/3[\s\S]*300-meter setting/, "Chapter 2 teaches temporary 25-meter setup and return to the 300-meter 8/3 setting once");
assert.doesNotMatch(source.split('id: "a2-3"')[0], /<svg|rifle-locator|sight-physical|drum-demo|diagram-ring|CLOCKWISE • ONE CLICK PAST 300/, "Chapter 2 contains no replacement hardware illustration or rejected abstract drum graphic");
assert.match(source, /task: "", action: "none", hideTask: true/, "Chapter 2 removes the classroom task and completion button");
assert.doesNotMatch(`${html}\n${source}\n${css}`, /PHOTOGRAPH USAGE RIGHTS|FOUNDER REVIEW REFERENCES|review-asset-note/, "the shooter-facing page contains no photograph-review notice");
assert.match(html, /chapterThreeRuntime[\s\S]*target_profile_id=baker_m16a2_25m_zero[\s\S]*prepared_demo=1[\s\S]*m16a2_demo=1[\s\S]*embedded_tstt=1/, "Chapter 3 preloads the prepared demonstration against the dedicated Baker M16A2 profile");
assert.match(source, /launchChapterThreeDemo\(\{ userGesture = false, automatic = false \}[\s\S]*\(userGesture \|\| automatic\)[\s\S]*controller\.startBakerSampleDemo\(\)/, "Chapter 3 starts the real prepared controller from either manual entry or the continuous teaching road");
assert.match(source, /onComplete: \(\) => completeCurrentTeachingChapter\(\)[\s\S]*state\.current > 1[\s\S]*advance\(\{ automatic: true \}\)/, "only Chapters 1 and 2 automatically continue after their narration finishes");
assert.match(source, /pendingAutomaticDemoStart[\s\S]*chapterThreeRuntime\.addEventListener\("load"[\s\S]*launchChapterThreeDemo\(\{ automatic: true \}\)/, "the Chapter 2 to Chapter 3 handoff survives a still-loading embedded runtime");
assert.doesNotMatch(`${html}\n${source}\n${css}`, /DEMO:|AUDIO:|STEP:|PLAYER STATE:|Founder runtime proof|chapter-three-runtime-proof/, "development instrumentation is absent from the finished shooter-facing TSTT experience");
assert.match(source, /sczn3-m16a2-demo-runtime[\s\S]*updateChapterThreeStartControl/, "the runtime event still hides the legitimate gesture control once the demo starts");
assert.match(chapterThreeSource, /Let Tap-n-Score show you[\s\S]*COMPLETE DEMONSTRATION[\s\S]*WATCH TAP-N-SCORE/, "Chapter 3 is a watch-only complete demonstration");
assert.match(source, /targetImage = "assets\/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg"[\s\S]*chapterThreeTargetImage = targetImage/, "every M16A2 chapter displays the same exact governed standard Baker production face");
assert.match(html, /assets\/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg/, "the pre-runtime target visual is bound to the governed standard M16A2 face");
assert.doesNotMatch(`${html}\n${source}`, /FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02\.png/, "the enlarged ST-M16A2R representation is not shooter-facing in the standard-face TSTT");
assert.match(chapterThreeSource, /adjustment-target[\s\S]*chapterThreeTargetImage[\s\S]*demo-launch/, "Chapter 3 prominently renders the supplied Baker target");
assert.doesNotMatch(chapterThreeSource, /TAKE PHOTO|CHOOSE EXISTING PHOTO|I FOUND|I CAN|YOUR TASK|\bPOIB\b|quiz|competenc/i, "Chapter 3 asks for no upload, observation, calculation, acknowledgment, or classroom gate");
assert.match(demoFixture, /M16A2-STANDARD-IRON-FSP-REAR-DRUM/, "the prepared example carries the exact equipment configuration");
assert.match(demoFixture, /M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011[\s\S]*authoritySource: "backend-authoritative"/, "the prepared example carries the governed M16A2 adjustment identity and output provenance");
assert.match(shoot, /PREPARED_M16A2_DEMO_MODE[\s\S]*SCZN3_BAKER_TALKING_DEMO_FIXTURE[\s\S]*bakerSampleDemoSteps[\s\S]*startBakerSampleDemo/, "the existing SCZN3 demonstration engine owns the automated Chapter 3 road");
const chapterThreeAudioPaths = [...shoot.matchAll(/audio: "(assets\/audio\/episode60\/chapter3\/[^"\n]+\.wav)"/g)].map(match => match[1]);
assert.equal(chapterThreeAudioPaths.length, 14, "every spoken Chapter 3 step has one native Samantha audio asset");
assert.equal(new Set(chapterThreeAudioPaths).size, 14, "Chapter 3 narration assets are mapped one-to-one without reuse");
assert.match(shoot, /allowSpeechFallback: !PREPARED_M16A2_DEMO_MODE/, "the prepared M16A2 demonstration disables Web Speech fallback");
assert.match(shoot, /m16a2TsttDemoControlsMarkup[\s\S]*data-player-action="toggle"[\s\S]*STOP[\s\S]*REPLAY CHAPTER[\s\S]*CHAPTERS[\s\S]*RESTART/, "the running Chapter 3 demo carries the governed TSTT PLAYER controls");
assert.match(shoot, /CENTER CROSSHAIRS[\s\S]*SHOT PATTERN[\s\S]*SHOW RESULTS[\s\S]*THE CENTER OF YOUR SHOT PATTERN[\s\S]*YOUR SIGHT ADJUSTMENT[\s\S]*ZERO CONFIRMED/, "the demonstration visibly completes the shooter-facing observation, correction, and confirmation sequence");
assert.match(chapterThreeDemoSource, /Now shoot your confirmation group\. You can use this target or put up a new one\. When you're finished, take another photo\.[\s\S]*Tap-n-Score marks each shot on the confirmation photograph\./, "Chapter 3 teaches physical confirmation through a second photograph before governed evaluation");
assert.match(shoot, /SECOND PHOTO[\s\S]*CONFIRMATION PHOTO[\s\S]*ZERO CONFIRMED/, "the second target photograph visibly enters before confirmation observations and results");
assert.match(shoot, /DEMONSTRATION COMPLETE[\s\S]*YOU'RE UP![\s\S]*GO TO CHAPTER 4/, "Chapter 3 ends with the Founder-approved shooter handoff");
assert.match(shoot, /action === "stop"[\s\S]*bakerSampleDemoPlayer\.stop\(\{ reset: true \}\)[\s\S]*location\.href = window\.SCZN3_BAKER_TALKING_DEMO_FIXTURE\.returnUrl/, "STOP during the prepared demonstration routes to the shared Chapter 4 doorway");
assert.doesNotMatch(chapterThreeDemoSource, /Backend Authority|governed authority|prepared (?:shot|confirmation) observations/i, "Chapter 3 narration contains no internal architecture or prepared-observation language");
assert.match(shoot, /FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE[\s\S]*data-demo-sight-control="rear-windage"[\s\S]*data-demo-sight-control="front-sight"/, "the governed adjustment reconnects to the approved real Chapter 2 hardware images");
assert.match(shoot, /state: "sec"[\s\S]*Your target, shots, adjustment, and confirmation are preserved together\.[\s\S]*state: "vault"[\s\S]*complete shooting session is saved in your Ballistic Vault/, "the demonstration gives SEC and Ballistic Vault one sentence of shooter-facing meaning");
assert.match(workspaceCss, /baker-demo-preservation-caption strong[\s\S]*font-size:clamp\(16px,2\.2vw,22px\)/, "the SEC and Vault artifact names are prominent on their demonstrated screens");
assert.doesNotMatch(shoot, /Chapter 4 gives you the controls\./, "the final handoff leaves destination clarity to its single Chapter 4 action");
assert.match(shoot, /REAR WINDAGE KNOB[\s\S]*FRONT SIGHT POST[\s\S]*COUNTERCLOCKWISE back to 8\/3/, "the demo names the governed controls, turn direction, and confirmed-zero return procedure");
assert.match(workspaceCss, /data-prepared-m16a2-demo="true"[\s\S]*#chooseTargetButton[\s\S]*display:none!important/, "Chapter 3 hides the premature Add Photo control while Chapter 4 retains photo entry");
assert.match(workspaceCss, /data-prepared-m16a2-demo="true"[\s\S]*baker-sample-watermark[\s\S]*color:rgba\(20,20,20,\.17\)[\s\S]*font-size:clamp\(36px,8vw,72px\)[\s\S]*writing-mode:horizontal-tb/, "Chapter 3 restores SAMPLE as a large readable translucent target watermark");
assert.match(workspaceCss, /data-prepared-m16a2-demo="true"[\s\S]*smart-target-completion-layout[\s\S]*inset:0[\s\S]*grid-template-columns:minmax\(0,460px\)[\s\S]*justify-content:center[\s\S]*align-content:center/, "the Chapter 3 completion handoff is centered over the target");
assert.match(workspaceCss, /prepared-demo-return[\s\S]*pointer-events:auto/, "the visible Chapter 3 completion handoff remains actionable above the target interaction surface");
assert.match(shoot, /layer\.addEventListener\(eventName[\s\S]*prepared-demo-return[\s\S]*stopPropagation/, "the Chapter 3 completion handoff is insulated from Precision Tap pointer handling");
assert.match(workspaceCss, /baker-sample-demo-layer[\s\S]*pointer-events:none[\s\S]*baker-sample-demo-scene[\s\S]*pointer-events:none/, "Chapter 3 teaching overlays leave Precision Tap pinch and pan hit testing available");
assert.match(demoFixture, /61\.2[\s\S]*33\.7[\s\S]*66[\s\S]*35\.1[\s\S]*63\.3[\s\S]*37\.7[\s\S]*8 clicks LEFT[\s\S]*4 clicks DOWN/, "the revised initial evidence has visible scatter and truthfully inherits its governed correction");
assert.match(demoFixture, /xPercent: 44, yPercent: 45[\s\S]*xPercent: 56, yPercent: 48\.7[\s\S]*xPercent: 50, yPercent: 52\.4[\s\S]*outcome: "CONFIRMED"/, "the confirmation evidence has believable visible dispersion and a governed confirmed result");
assert.match(records, /PREPARED_DEMO_MODE[\s\S]*experienceMode[\s\S]*demonstration/, "prepared Chapter 3 preservation uses real records surfaces without a simulation label");
assert.match(player, /speechRate[\s\S]*speechVoiceResolver/, "the reusable player accepts the governed Samantha voice and 0.70 rate for the demo");
assert.match(player, /allowSpeechFallback = options\.allowSpeechFallback !== false[\s\S]*if \(!this\.allowSpeechFallback \|\| !global\.speechSynthesis/, "the reusable PLAYER can run governed audio without touching Web Speech");
assert.match(source, /Shoot three to five shots while aiming at the center crosshairs\.[\s\S]*Take a photo of your target or choose one from your photos\./, "Chapter 4 carries the concise shooter photo-entry script");
assert.match(chapterFourSource, /YOU'RE UP![\s\S]*Shoot Your Own Target[\s\S]*TAKE PHOTO[\s\S]*CHOOSE EXISTING PHOTO/, "Chapter 4 is the Founder-approved shooter-control entry");
assert.doesNotMatch(chapterFourSource, /YOUR TURN/, "Chapter 4 no longer carries the retired identity");
assert.match(chapterFourSource, /chapterFourPhotoRoad\("camera"\)[\s\S]*chapterFourPhotoRoad\("existing"\)/, "Chapter 4 hands both photo choices to the governed road");
assert.match(source, /tapNScoreRoad = "matrix\.html\?target_profile_id=baker_m16a2_25m_zero&founder_review=1&tstt_chapter=4"[\s\S]*chapterFourPhotoRoad[\s\S]*state\.equipment\.activeId[\s\S]*equipment_profile_id/, "Chapter 4 passes any ACTIVE\/SELECTED equipment to the dedicated Baker M16A2 road for backend applicability admission");
assert.match(source, /equipmentLibraryUrl\(photoSource[\s\S]*tapNScoreRoad[\s\S]*view=library[\s\S]*photo_source/, "Chapter 4 preserves M16A2 target and photo intent when the existing New Equipment road is needed");
assert.match(matrix, /tsttChapterQuery = TSTT_SHOOTER_HANDOFF \? "&tstt_chapter=4"[\s\S]*photoSource[\s\S]*shoot\.html\?session=[\s\S]*founderReviewQuery[\s\S]*tsttChapterQuery[\s\S]*photoSource/, "the governed session handoff preserves the Chapter 4 identity and requested photo source");
assert.match(matrix, /equipmentSupportsGovernedRoad[\s\S]*officialMission\.status === "eligible"[\s\S]*correction\.status === "available"/, "the backend assessment, not TSTT presentation code, determines whether selected equipment can use the governed road");
assert.match(matrix, /selectedEquipmentProfileId = requestedEquipmentProfileId \|\| activeEquipmentProfileId\(\)[\s\S]*governed\.item\.setup\.setupId === selectedEquipmentProfileId[\s\S]*await goToTarget\(\)/, "the Chapter 4 handoff automatically reuses backend-admitted ACTIVE\/SELECTED equipment");
assert.match(matrix, /continueTsttShooterHandoff[\s\S]*nextQuery\.delete[\s\S]*equipment_profile_id[\s\S]*saveSetup[\s\S]*continueTsttShooterHandoff\(saved\.setupId\)/, "the existing New Equipment road preserves and resumes the M16A2 photo-entry handoff after save/select");
assert.match(source, /applyDirectChapterEntry[\s\S]*state\.started = true[\s\S]*state\.current = requested - 1[\s\S]*state\.unlocked = chapters\.length - 1/, "returning shooters can enter Chapter 4 directly with all Chapters navigation available");
assert.match(shoot, /REQUESTED_PHOTO_SOURCE[\s\S]*openRequestedPhotoEntry[\s\S]*precisionTapPhotoPicker[\s\S]*resolveMissionFromTargetProfile\(\)\.then\(openRequestedPhotoEntry\)/, "the proven target workspace opens its real photo picker after target resolution completes");
assert.match(shoot, /targetCameraInput[\s\S]*capture="environment"[\s\S]*targetImageInput[\s\S]*Tap Your Aim Point[\s\S]*Tap Your Shots[\s\S]*Show Results/, "the handoff uses the established Take Photo, existing-photo, Precision Tap, and results controls");
assert.match(shoot, /function activeEvidence[\s\S]*zeroingLivePhase === "confirmation"[\s\S]*confirmationPhotoRequired[\s\S]*confirmationEvidenceImage/, "the shared road uses separately supplied confirmation-photo evidence instead of recycling the original photograph");
assert.match(shoot, /zeroingLivePhase = "confirmation"[\s\S]*confirmationPhotoRequired = true[\s\S]*renderEvidencePreview\(null\)[\s\S]*openPhotoEntryPicker\(\)/, "a governed initial correction transitions to mandatory second-photo entry");
assert.match(shoot, /savePatch\.confirmationEvidenceImage = activeEvidence\(\)[\s\S]*savePatch\.confirmationImpactPoints/, "the shared road preserves the second photo with only its confirmation observations");
assert.match(shoot, /zeroingClicksFromAuthorityPackage[\s\S]*directionalAuthorityRelease[\s\S]*mechanicalValidation\?\.status !== "calculated"[\s\S]*initialZeroingCorrectionReady[\s\S]*currentClicks/, "BEGIN CONFIRMATION consumes the same governed registration, direction, and mechanical correction release that produced the visible click result");
assert.match(shoot, /WE CAN’T VERIFY THIS TARGET[\s\S]*data-authority-retry-photo[\s\S]*Try Again[\s\S]*data-authority-exit[\s\S]*Exit/, "fail-closed target recovery gives the shooter only truthful TRY AGAIN and EXIT actions");
assert.doesNotMatch(shoot, /The directional correction was withheld because its source evidence did not reconcile\./, "internal reconciliation language does not leak into shooter-facing recovery");
assert.match(workspace, /createPrecisionTap[\s\S]*pointer[\s\S]*(?:scale|zoom)[\s\S]*(?:translate|pan)/i, "the established Precision Tap owner retains anchored source-image interaction and zoom/pan behavior");
assert.match(m4Runtime, /\/api\/authority\/m4[\s\S]*requestAuthority[\s\S]*saveInitialAuthority[\s\S]*saveConfirmationAuthority/, "backend M16A2 authority remains the sole correction and confirmation owner");
assert.match(m4Runtime, /SCZN3ZeroingPlatform\.authorityRequest/, "the legacy runtime bridge delegates zeroing requests to the shared platform capability");
assert.doesNotMatch(m4Runtime, /m16a2Geometry|gridSquareInches|M16A2-STANDARD-IRON-FSP-REAR-DRUM|M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011/, "the runtime no longer rebuilds M16A2 geometry or mechanical authority");
assert.match(zeroingPlatform, /photo-entry[\s\S]*precision-tap[\s\S]*undo-clear[\s\S]*show-results[\s\S]*confirmation-photo-entry[\s\S]*generate-zeroing-sec[\s\S]*add-to-ballistic-vault[\s\S]*failure-recovery/, "one platform capability owns the complete governed zeroing road");
assert.match(zeroingProfiles, /capabilityId: platform\.CAPABILITY_ID/, "Target Profiles point to the shared zeroing capability");
assert.match(zeroingProfiles, /baker_m16a2_25m_zero[\s\S]*m4_25m_zero/, "M16A2 and M4 are both registered as consumers of that capability");
assert.match(sessionAuthority, /standard_m16a2_family_profile[\s\S]*M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011[\s\S]*M16A2-STANDARD-IRON-FSP-REAR-DRUM[\s\S]*baker_m16a2_25m_zero/, "Backend Session Authority supplies the governed M16A2 mechanical package through the reusable family profile");
assert.match(zeroingProfiles, /confirmationInstruction: "Then shoot a new confirmation group\. You can use this target or a new one\. Take a photo of that target, then tap only the new confirmation bullet holes\."/, "the M16A2 Target Profile carries the physical confirmation-photo sequence");
assert.match(zeroingProfiles, /confirmationInstruction:[\s\S]*Then shoot a new confirmation group[\s\S]*confirmationAudio:[\s\S]*episode60\/chapter4\/01-confirmation-sequence\.wav/, "the M16A2 Target Profile supplies its approved confirmation teaching content");
assert.match(shoot, /activeZeroingExperience\(\)\?\.presentation[\s\S]*new Audio\(presentation\.confirmationAudio\)[\s\S]*playTsttChapterFourConfirmationNarration\(\)/, "the shared road presents and plays target-supplied confirmation content at the actual transition");
assert.match(reviewServer, /episode60\/chapter4\/01-confirmation-sequence\.wav/, "the Founder LAN runtime serves the Chapter 4 native Samantha confirmation clip");
assert.match(shoot, /On the confirmation target photo, tap only the new confirmation bullet holes\.[\s\S]*Tap Show Results for these new confirmation shots\./, "the shared road distinguishes new confirmation holes from the original group");
assert.match(zeroingProfiles, /confirmedInstruction: "Your zero is confirmed\. Turn the rear elevation drum one click COUNTERCLOCKWISE back to 8\/3 for your 300-meter setting\."/, "the M16A2 Target Profile supplies its finalization procedure");
assert.match(narrationStandard, /one thought per sentence[\s\S]*Pause briefly after every sentence[\s\S]*Use one governed name[\s\S]*visual and audio teaching in the same sequence/i, "the reusable governance artifact preserves the Founder narration rules");
assert.doesNotMatch(`${html}\n${source}\n${css}`, /equipment-dot|EXACT TRAINING MATCH · CONFIRM GEAR|THIS MATCHES MY GEAR|confirm-equipment|CONFIRM YOUR GEAR|NOT CONFIRMED AS YOUR EQUIPMENT/, "physical-equipment confirmation UI and its orange/gold status dot are removed");
assert.doesNotMatch(`${html}\n${source}`, /confirm (?:this |the )?target|target confirmation/i, "QR-established target identity is never reconfirmed by the shooter");
assert.match(source, /YOU ARE HERE/, "direct navigation marks the current chapter");
assert.match(html, /PROFICIENCY[\s\S]*☆☆☆[\s\S]*shooting results—not chapter progress/, "proficiency remains separate from course progress");
assert.match(source, /renderProgress[\s\S]*is-current/, "course advancement uses chapter segments");
assert.doesNotMatch(`${html}\n${source}`, /KNOW YOUR TARGET|BAKER TARGETS • ST-M16A2R|RETURN AFTER SELECTING YOUR EQUIPMENT/, "Pass #2 removes the three rejected Chapter 1 surfaces");
assert.match(source, /equipmentConfigurationId === "M16A2-STANDARD-IRON-FSP-REAR-DRUM"[\s\S]*adjustmentProfileId === "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"/, "exact training requires the governed equipment configuration and reusable adjustment profile");
assert.match(source, /compatible \? "exact" : "different"/, "equipment authority distinguishes an exact configuration without turning it into entry permission");
assert.match(source, /startTraining\(\)[\s\S]*state\.unlocked = chapters\.length - 1/, "training entry and chapter navigation are not gated by equipment state");
assert.match(html, /SHOOTING SETUP[\s\S]*sessionDistance[\s\S]*sessionAdjustmentUnit[\s\S]*sessionAdjustmentIncrement/, "the target session owns a compact shooting-setup drawer");
assert.match(source, /25[\s\S]*METERS[\s\S]*MOA[\s\S]*Elevation 1\.25 · Windage 0\.5/, "the exact branch projects governed session conditions and both applicable adjustments");
assert.match(source, /Different equipment requires its own governed adjustment authority/, "permissive training entry does not broaden equipment-specific adjustment authority");
assert.match(source, /SCZN3_TSTT_M16A2_JOURNEY_V1[\s\S]*preserveJourney[\s\S]*restoreJourney/, "the same TSTT journey survives the Equipment Library round trip");
assert.match(source, /return_to=m16a2-tstt\.html&return_chapter=/, "the Equipment Library link preserves the exact TSTT origin and chapter");
assert.match(html, /shootingSetupNote[\s\S]*equipmentLibraryLink[\s\S]*EQUIPMENT LIBRARY/, "Equipment Library remains quietly available inside Shooting Setup");
assert.match(source, /target-window is-full-target/, "Chapter 1 requests the complete physical target thumbnail");
assert.match(html, /player-controls[\s\S]*player-start[\s\S]*▶[\s\S]*START SESSION/, "START SESSION lives in the fixed PLAYER rail before training begins");
assert.match(css, /data-status="waiting"[\s\S]*player-start[\s\S]*display: block/, "the pre-start PLAYER rail makes START SESSION dominant");
assert.match(matrix, /EQUIPMENT_RETURN_PATH[\s\S]*RETURN TO CHAPTER[\s\S]*returnToEquipmentOrigin/, "Equipment Library exposes the direct origin-preserving return");
assert.match(matrix, /function conciseEquipmentName[\s\S]*join\(" · "\)/, "Equipment Library owns one concise equipment display name");
assert.match(matrix, /setActiveEquipmentProfile\(setupId\)[\s\S]*returnToEquipmentOrigin/, "existing-equipment selection commits before direct return");
assert.match(matrix, /Military M-Series Rifles[\s\S]*M16A2[\s\S]*M16A2-STANDARD-IRON-FSP-REAR-DRUM/, "M16A2 standard iron sights are discoverable through the existing Equipment Library");
assert.match(matrix, /function discoveryOrderedOptions[\s\S]*localeCompare[\s\S]*\.\.\.other/, "equipment discovery is alphabetized while Other remains last");
assert.match(source, /For your 25-meter zero, set the drum to 8\/3, then turn it one click CLOCKWISE past 8\/3[\s\S]*After your zero is confirmed, turn it one click COUNTERCLOCKWISE back to 8\/3 for the 300-meter setting/, "Chapter 2 teaches the Founder-approved M16A2 rear-drum setup and return");
assert.match(source, /CLOCKWISE[\s\S]*COUNTERCLOCKWISE/, "rotation language is explicit");
assert.doesNotMatch(chapterThreeSource, /fetch\(|XMLHttpRequest|\/api\//, "Chapter 3 frontend does not recreate backend correction authority");
assert.match(shoot, /const subtle = globalThis\.crypto && globalThis\.crypto\.subtle[\s\S]*const sha256 = digest \?[^:]+: ""/, "plain-HTTP LAN review keeps photo entry available when browser Web Crypto is unavailable");
assert.match(shoot, /pendingEvidence\.sourceImageSha256 = pendingEvidence\.sourceImageSha256[\s\S]*registration\.sourceImage\.sha256[\s\S]*pendingEvidence\.originalSourceImageSha256/, "the browser preserves the authoritative backend-computed source-image hash when client hashing is unavailable");
assert.match(registrationAuthority, /if claimed and not SHA256_PATTERN\.fullmatch\(claimed\)[\s\S]*backend_hash = hashlib\.sha256\(image_bytes\)\.hexdigest\(\)[\s\S]*if claimed and backend_hash != claimed/, "backend authority always computes the image hash and validates a client hash whenever one is available");
assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|\/api\//, "the pre-fire lesson does not call execution authority");
assert.match(css, /100svh/, "the shell is sized for a phone viewport");
assert.match(css, /safe-area-inset-bottom/, "phone safe areas protect the fixed controls");
assert.match(css, /chapter-progress \{[^}]*repeat\(4, 1fr\)/, "four course chapters render as four progress segments");
assert.match(html, /maximum-scale=1, user-scalable=no[\s\S]*tstt_viewport_guard\.js/, "the TSTT shell declares its fixed responsive viewport before runtime starts");
assert.match(shoot, /tstt_viewport_guard\.js/, "the embedded Chapter 3 TSTT runtime uses the same viewport guard");
assert.match(viewportGuard, /maximum-scale=1, user-scalable=no[\s\S]*gesturestart[\s\S]*gesturechange[\s\S]*gestureend[\s\S]*touches\.length > 1[\s\S]*ctrlKey/, "the universal viewport guard blocks page-level touch, Safari gesture, and trackpad pinch zoom");
assert.match(viewportGuard, /documentElement\.dataset\.tsttPage === "true" \|\| query\.get\("embedded_tstt"\) === "1"/, "the viewport guard installs only on the outer or embedded TSTT shell");
assert.match(css, /html, body[^{]*\{[^}]*touch-action: pan-x pan-y/, "the outer TSTT shell permits scrolling without browser pinch zoom");
assert.match(workspaceCss, /precision-tap-viewport[\s\S]*touch-action:none/, "Precision Tap retains its intentional target-owned pinch and pan surface");
for (const build of [buildSite, buildNetlify]) {
  assert.match(build, /"m16a2-tstt\.html"/, "the route is included in the build inventory");
  assert.match(build, /"m16a2-tstt\.css"/, "the stylesheet is included in the build inventory");
  assert.match(build, /"m16a2-tstt\.js"/, "the lesson runtime is included in the build inventory");
  assert.match(build, /"tstt_narration\.js"/, "the reusable narration runtime is included in the build inventory");
  assert.match(build, /"tstt_viewport_guard\.js"/, "the universal TSTT viewport guard is included in the build inventory");
  assert.match(build, /"zeroing_target_profiles\.js"/, "governed zeroing Target Profile differences are included in the build inventory");
  assert.match(build, /"m16a2_talking_demo_session\.js"/, "the prepared M16A2 demonstration fixture is included in the build inventory");
  assert.match(build, /FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02\.png/, "the preserved target evidence is included in the build inventory");
  assert.match(build, /BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg/, "the exact governed standard Baker M16A2 face is included in the build inventory");
  assert.doesNotMatch(build, /FOUNDER_M16A2_(?:FRONT_SIGHT|REAR_WINDAGE|REAR_ELEVATION)/, "uncleared Chapter 2 reference photographs cannot enter the production build inventory");
}
assert.match(reviewServer, /FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE[\s\S]*FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE/, "the local review server permits all three Founder-supplied references");
assert.match(reviewServer, /shoot\.html[\s\S]*sec\.html[\s\S]*records\.html[\s\S]*BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg/, "the local review server permits the governed standard face, interaction, and preservation road");
assert.match(reviewServer, /tstt_viewport_guard\.js/, "the LAN review server serves the universal TSTT viewport guard");
assert.match(reviewServer, /pathname\.startsWith\("\/api\/"\)[\s\S]*proxyAuthority/, "private-LAN review proxies governed API calls through the allowed Node review executable");
assert.match(reviewServer, /const host = process\.argv\[3\] \|\| "127\.0\.0\.1"/, "the review server keeps uncleared reference photographs on localhost unless LAN exposure is explicitly requested");

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT contract");
